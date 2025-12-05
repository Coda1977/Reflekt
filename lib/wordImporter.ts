import mammoth from "mammoth";

interface ParsedBlock {
  type: "text" | "input" | "checkbox" | "image" | "iframe";
  id: string;
  content?: string;
  label?: string;
  placeholder?: string;
  multiline?: boolean;
  url?: string;
  alt?: string;
  height?: string;
}

interface ParsedPage {
  id: string;
  title: string;
  blocks: ParsedBlock[];
}

interface ParsedSection {
  id: string;
  title: string;
  pages: ParsedPage[];
}

export interface ParsedWorkbook {
  title: string;
  sections: ParsedSection[];
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

export async function parseWordDocument(file: File): Promise<ParsedWorkbook> {
  const arrayBuffer = await file.arrayBuffer();

  // Parse with mammoth to get raw HTML and messages
  const result = await mammoth.convertToHtml(
    { arrayBuffer },
    {
      styleMap: [
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh",
        "p[style-name='Heading 3'] => h3:fresh",
      ],
    }
  );

  const html = result.value;

  // Parse the HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection | null = null;
  let currentPage: ParsedPage | null = null;

  const elements = doc.body.children;

  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    const tagName = element.tagName.toLowerCase();
    const textContent = element.textContent?.trim() || "";

    if (!textContent) continue; // Skip empty elements

    // H1 = New Section
    if (tagName === "h1") {
      // Save previous section
      if (currentSection && currentPage) {
        currentSection.pages.push(currentPage);
      }
      if (currentSection) {
        sections.push(currentSection);
      }

      // Create new section
      currentSection = {
        id: generateId(),
        title: textContent,
        pages: [],
      };
      currentPage = null;
    }
    // H2 = New Page
    else if (tagName === "h2") {
      // Save previous page
      if (currentSection && currentPage) {
        currentSection.pages.push(currentPage);
      }

      // Create new page
      currentPage = {
        id: generateId(),
        title: textContent,
        blocks: [],
      };

      // If no section exists, create a default one
      if (!currentSection) {
        currentSection = {
          id: generateId(),
          title: "Section 1",
          pages: [],
        };
      }
    }
    // Regular content
    else if (tagName === "p") {
      // Ensure we have a section and page
      if (!currentSection) {
        currentSection = {
          id: generateId(),
          title: "Section 1",
          pages: [],
        };
      }
      if (!currentPage) {
        currentPage = {
          id: generateId(),
          title: "Page 1",
          blocks: [],
        };
      }

      // Check if this is a question/input field
      const isQuestion = isQuestionParagraph(element);

      if (isQuestion) {
        // Create input block
        currentPage.blocks.push({
          type: "input",
          id: generateId(),
          label: textContent,
          placeholder: "Enter your response...",
          multiline: true,
        });
      } else {
        // Create text block with simple HTML
        const innerHTML = element.innerHTML;

        // Convert to Tiptap JSON format (simplified)
        const tiptapContent = {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: innerHTML
                ? [{ type: "text", text: textContent }]
                : [],
            },
          ],
        };

        currentPage.blocks.push({
          type: "text",
          id: generateId(),
          content: JSON.stringify(tiptapContent),
        });
      }
    }
    // Lists could be checkboxes
    else if (tagName === "ul" || tagName === "ol") {
      if (!currentSection) {
        currentSection = {
          id: generateId(),
          title: "Section 1",
          pages: [],
        };
      }
      if (!currentPage) {
        currentPage = {
          id: generateId(),
          title: "Page 1",
          blocks: [],
        };
      }

      // For now, just convert lists to text blocks
      const tiptapContent = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: textContent }],
          },
        ],
      };

      currentPage.blocks.push({
        type: "text",
        id: generateId(),
        content: JSON.stringify(tiptapContent),
      });
    }
  }

  // Save final section and page
  if (currentSection && currentPage) {
    currentSection.pages.push(currentPage);
  }
  if (currentSection) {
    sections.push(currentSection);
  }

  // If no sections were found, create a default structure
  if (sections.length === 0) {
    sections.push({
      id: generateId(),
      title: "Imported Content",
      pages: [
        {
          id: generateId(),
          title: "Page 1",
          blocks: [
            {
              type: "text",
              id: generateId(),
              content: JSON.stringify({
                type: "doc",
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text: "No content could be extracted from the document.",
                      },
                    ],
                  },
                ],
              }),
            },
          ],
        },
      ],
    });
  }

  // Extract title from filename
  const title = file.name.replace(/\.(docx|doc)$/i, "");

  return {
    title,
    sections,
  };
}

// Detect if a paragraph is a question based on:
// 1. Text color (non-black)
// 2. Highlighting
// 3. Special markers like [Q], [INPUT], etc.
function isQuestionParagraph(element: Element): boolean {
  const text = element.textContent?.trim() || "";

  // Check for special markers
  if (
    text.startsWith("[Q]") ||
    text.startsWith("[INPUT]") ||
    text.startsWith("[QUESTION]") ||
    text.startsWith("Q:")
  ) {
    return true;
  }

  // Check for colored text (has style with color)
  const style = element.getAttribute("style") || "";
  if (style.includes("color") && !style.includes("color: #000000") && !style.includes("color: black")) {
    return true;
  }

  // Check for highlighting (background-color)
  if (style.includes("background-color") && !style.includes("background-color: transparent")) {
    return true;
  }

  // Check child elements for color/highlighting
  const spans = element.querySelectorAll("span, strong, em");
  for (let i = 0; i < spans.length; i++) {
    const spanStyle = spans[i].getAttribute("style") || "";
    if (
      (spanStyle.includes("color") && !spanStyle.includes("color: #000000") && !spanStyle.includes("color: black")) ||
      (spanStyle.includes("background-color") && !spanStyle.includes("background-color: transparent"))
    ) {
      return true;
    }
  }

  return false;
}
