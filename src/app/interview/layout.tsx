export default function InterviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ margin: 0, padding: 0, backgroundColor: "#0d1117", minHeight: "100vh" }}>
      {children}
    </div>
  );
}