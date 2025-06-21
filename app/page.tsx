// @ts-nocheck
"use client"
  "use client"
"use client"
import { useState } from "react"

export default function MindCast() {
  const [input, setInput] = useState("")
  const [result, setResult] = useState("")

  const handleSubmit = () => {
    // Simple demo without AI
    if (input.toLowerCase().includes("stress")) {
      setResult("😤 Stressed detected! Take a deep breath...")
    } else if (input.toLowerCase().includes("sad")) {
      setResult("😢 Feeling down? You're not alone...")
    } else {
      setResult("😌 Let's find some calm together...")
    }
  }

  return (
    <div className="min-h-screen p-8 bg-blue-50">
      <h1 className="text-4xl font-bold text-center mb-8">🎧 MindCast</h1>
      <div className="max-w-2xl mx-auto space-y-4">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="How are you feeling today?"
          className="w-full p-4 border rounded-lg"
          rows={4}
        />
        <button
          onClick={handleSubmit}
          className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700"
        >
          Generate Podcast
        </button>
        {result && (
          <div className="p-4 bg-white rounded-lg border">
            <p className="text-lg">{result}</p>
          </div>
        )}
      </div>
    </div>
  )
}
