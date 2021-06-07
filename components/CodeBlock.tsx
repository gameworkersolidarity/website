import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { tomorrow } from "react-syntax-highlighter/dist/cjs/styles/prism"

export function CodeBlock ({ language, value }) {
  return (
    <SyntaxHighlighter
      language={language}
      style={tomorrow}
      wrapLines={true}
      showLineNumbers={true}
    >
      {value}
    </SyntaxHighlighter>
  )
}