import { useState, useEffect } from "react";
import StudentPage from "./pages/StudentPage";
import FacultyPage from "./pages/FacultyPage";

function App() {
  const [mode, setMode] = useState<"student" | "faculty" | "landing">("landing");
  const [examId, setExamId] = useState<string>("");
  const [encodedConfig, setEncodedConfig] = useState<string>("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash;

    if (params.get("faculty") !== null) {
      setMode("faculty");
      return;
    }

    // Hash-based exam link: #exam=base64encodedconfig
    if (hash.startsWith("#exam=")) {
      setEncodedConfig(hash.substring(6));
      setMode("student");
      return;
    }

    // Query param fallback
    const eid = params.get("exam");
    if (eid) {
      setExamId(eid);
      setMode("student");
      return;
    }
  }, []);

  if (mode === "faculty") {
    return (
      <div>
        <FacultyPage />
        <div className="fixed bottom-4 right-4 print:hidden">
          <button
            onClick={() => {
              setMode("landing");
              window.history.replaceState({}, "", window.location.pathname);
            }}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Exit Faculty Mode
          </button>
        </div>
      </div>
    );
  }

  if (mode === "student") {
    return <StudentPage examId={examId} encodedConfig={encodedConfig} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Practical Exam System</h1>
        <p className="text-sm text-gray-500 mb-8">
          If you received an exam link, use that link directly. Otherwise, contact your faculty for the exam URL.
        </p>
        <button
          onClick={() => {
            setMode("faculty");
            window.history.replaceState({}, "", "?faculty");
          }}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Faculty Access
        </button>
      </div>
    </div>
  );
}

export default App;
