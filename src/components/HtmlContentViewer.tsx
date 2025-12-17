interface HtmlContentViewerProps {
  content: string;
  primaryColor: string;
}

export default function HtmlContentViewer({ content, primaryColor }: HtmlContentViewerProps) {
  return (
    <div
      className="html-content"
      dangerouslySetInnerHTML={{ __html: content }}
      style={{
        lineHeight: '1.8',
        color: '#334155',
        fontSize: '1.0625rem',
      }}
    />
  );
}
