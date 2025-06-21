// @ts-nocheck
"use client"
  "use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { Mic, MicOff, Play, Pause, Brain, Heart, Zap, MessageSquare, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { generatePodcast } from "./actions"

interface MoodEntry {
  timestamp: Date
  mood: string
  confidence: number
  transcript: string
}

export default function MindCast() {
  const [isRecording, setIsRecording] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [textInput, setTextInput] = useState("")
  const [detectedMood, setDetectedMood] = useState<string | null>(null)
  const [podcastContent, setPodcastContent] = useState<string | null>(null)
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([])
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [speechSupported, setSpeechSupported] = useState(false)
  const [useTextInput, setUseTextInput] = useState(false)

  const recognitionRef = useRef<any | null>(null)

  useEffect(() => {
    // Check for speech recognition support
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      setSpeechSupported(true)
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = false
      recognitionRef.current.lang = "en-US"

      recognitionRef.current.onresult = (event: any) => {
        const result = event.results[0][0].transcript
        setTranscript(result)
        setIsRecording(false)
        console.log("Speech result:", result)
      }

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error)
        setError(`Speech recognition error: ${event.error}`)
        setIsRecording(false)
      }

      recognitionRef.current.onend = () => {
        setIsRecording(false)
      }
    } else {
      console.log("Speech recognition not supported")
      setUseTextInput(true)
    }

    // Load mood history from localStorage
    const savedHistory = localStorage.getItem("mindcast-history")
    if (savedHistory) {
      try {
        setMoodHistory(
          JSON.parse(savedHistory).map((entry: any) => ({
            ...entry,
            timestamp: new Date(entry.timestamp),
          })),
        )
      } catch (e) {
        console.error("Error loading history:", e)
      }
    }
  }, [])

  const startRecording = async () => {
    try {
      setError(null)
      setIsRecording(true)
      setTranscript("")
      setDetectedMood(null)
      setPodcastContent(null)

      if (recognitionRef.current) {
        recognitionRef.current.start()
        console.log("Speech recognition started")
      }
    } catch (error) {
      console.error("Error starting recording:", error)
      setError("Failed to start recording. Please try the text input instead.")
      setIsRecording(false)
    }
  }

  const stopRecording = () => {
    setIsRecording(false)
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
  }

  const handleSubmit = async () => {
    const inputText = useTextInput ? textInput : transcript

    if (!inputText.trim()) {
      setError("Please provide some input about how you're feeling")
      return
    }

    await processMoodAndGeneratePodcast(inputText.trim())
  }

  const processMoodAndGeneratePodcast = async (text: string) => {
    setIsProcessing(true)
    setProgress(25)
    setError(null)

    try {
      console.log("Processing text:", text)
      setProgress(50)

      const result = await generatePodcast(text)
      console.log("Generated result:", result)

      setProgress(75)
      setDetectedMood(result.mood)
      setPodcastContent(result.content)

      // Save mood entry
      const newEntry: MoodEntry = {
        timestamp: new Date(),
        mood: result.mood,
        confidence: result.confidence,
        transcript: text,
      }

      const updatedHistory = [...moodHistory, newEntry]
      setMoodHistory(updatedHistory)
      localStorage.setItem("mindcast-history", JSON.stringify(updatedHistory))

      setProgress(100)

      // Clear inputs
      setTextInput("")
      setTranscript("")
    } catch (error) {
      console.error("Error processing mood:", error)
      setError("Failed to generate podcast. Please try again.")
    } finally {
      setIsProcessing(false)
      setProgress(0)
    }
  }

  const togglePlayback = () => {
    if (isPlaying) {
      speechSynthesis.cancel()
      setIsPlaying(false)
    } else if (podcastContent) {
      const utterance = new SpeechSynthesisUtterance(podcastContent)
      utterance.rate = 0.8
      utterance.pitch = 0.9
      utterance.volume = 0.8

      const voices = speechSynthesis.getVoices()
      const preferredVoice =
        voices.find(
          (voice) =>
            voice.name.includes("Female") ||
            voice.name.includes("Samantha") ||
            voice.name.includes("Karen") ||
            voice.lang.includes("en"),
        ) || voices[0]

      if (preferredVoice) {
        utterance.voice = preferredVoice
      }

      utterance.onend = () => setIsPlaying(false)
      utterance.onerror = (e) => {
        console.error("Speech synthesis error:", e)
        setIsPlaying(false)
        setError("Failed to play audio. Your browser may not support text-to-speech.")
      }

      speechSynthesis.speak(utterance)
      setIsPlaying(true)
    }
  }

  const getMoodColor = (mood: string) => {
    const colors: Record<string, string> = {
      happy: "bg-yellow-100 text-yellow-800 border-yellow-200",
      sad: "bg-blue-100 text-blue-800 border-blue-200",
      anxious: "bg-red-100 text-red-800 border-red-200",
      stressed: "bg-orange-100 text-orange-800 border-orange-200",
      tired: "bg-gray-100 text-gray-800 border-gray-200",
      hopeful: "bg-green-100 text-green-800 border-green-200",
      calm: "bg-purple-100 text-purple-800 border-purple-200",
    }
    return colors[mood.toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200"
  }

  const getMoodIcon = (mood: string) => {
    switch (mood.toLowerCase()) {
      case "happy":
        return "😊"
      case "sad":
        return "😢"
      case "anxious":
        return "😰"
      case "stressed":
        return "😤"
      case "tired":
        return "😴"
      case "hopeful":
        return "🌟"
      case "calm":
        return "😌"
      default:
        return "🎭"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Brain className="h-8 w-8 text-indigo-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              MindCast
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your AI-powered mood companion. Share your feelings and get a personalized podcast.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Input Method Toggle */}
        <div className="flex justify-center gap-2">
          <Button
            variant={useTextInput ? "outline" : "default"}
            onClick={() => setUseTextInput(false)}
            disabled={!speechSupported}
          >
            <Mic className="h-4 w-4 mr-2" />
            Voice Input
          </Button>
          <Button variant={useTextInput ? "default" : "outline"} onClick={() => setUseTextInput(true)}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Text Input
          </Button>
        </div>

        {/* Main Input Interface */}
        <Card className="border-2 border-dashed border-indigo-200 bg-white/50 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              How are you feeling today?
            </CardTitle>
            <CardDescription>
              {useTextInput
                ? "Type about your current mood and feelings"
                : "Press the microphone and share what's on your mind"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {useTextInput ? (
              /* Text Input Mode */
              <div className="space-y-4">
                <Textarea
                  placeholder="Tell me how you're feeling today... (e.g., 'I feel overwhelmed with work and need some calm', 'I'm excited but also nervous about tomorrow')"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="min-h-[120px] resize-none"
                  disabled={isProcessing}
                />
                <div className="flex justify-center">
                  <Button
                    onClick={handleSubmit}
                    disabled={isProcessing || !textInput.trim()}
                    size="lg"
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isProcessing ? (
                      <>
                        <Brain className="h-5 w-5 mr-2 animate-spin" />
                        Creating Your Podcast...
                      </>
                    ) : (
                      <>
                        <Zap className="h-5 w-5 mr-2" />
                        Generate Podcast
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              /* Voice Input Mode */
              <div className="space-y-4">
                <div className="flex justify-center">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessing}
                    size="lg"
                    className={`h-20 w-20 rounded-full transition-all duration-300 ${
                      isRecording ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                  >
                    {isRecording ? <MicOff className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                  </Button>
                </div>

                {transcript && (
                  <Card className="bg-gray-50">
                    <CardContent className="pt-4">
                      <p className="text-gray-700 italic">"{transcript}"</p>
                      <div className="flex justify-center mt-4">
                        <Button onClick={handleSubmit} disabled={isProcessing}>
                          <Zap className="h-4 w-4 mr-2" />
                          Generate Podcast
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Status */}
            <div className="text-center">
              {isRecording && (
                <p className="text-red-600 font-medium animate-pulse">
                  🎙️ Listening... Speak freely about how you're feeling
                </p>
              )}
              {isProcessing && (
                <div className="space-y-2">
                  <p className="text-indigo-600 font-medium">
                    🧠 Analyzing your mood and creating your personalized podcast...
                  </p>
                  <Progress value={progress} className="w-full max-w-md mx-auto" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mood Detection & Podcast */}
        {detectedMood && podcastContent && (
          <Card className="bg-white/70 backdrop-blur-sm border-2 border-indigo-100">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Zap className="h-5 w-5 text-indigo-600" />
                  <CardTitle>Your Personalized Podcast</CardTitle>
                </div>
                <Badge className={`${getMoodColor(detectedMood)} border`}>
                  {getMoodIcon(detectedMood)} {detectedMood}
                </Badge>
              </div>
              <CardDescription>
                Based on your mood, here's a personalized audio experience crafted just for you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-lg">
                <p className="text-gray-700 leading-relaxed">{podcastContent}</p>
              </div>

              <div className="flex justify-center">
                <Button onClick={togglePlayback} size="lg" className="bg-green-600 hover:bg-green-700">
                  {isPlaying ? (
                    <>
                      <Pause className="h-5 w-5 mr-2" />
                      Pause Podcast
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      Play Podcast
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mood History */}
        {moodHistory.length > 0 && (
          <Card className="bg-white/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-indigo-600" />
                Your Mood Journey
              </CardTitle>
              <CardDescription>Track your emotional wellness over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {moodHistory
                  .slice(-5)
                  .reverse()
                  .map((entry, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getMoodIcon(entry.mood)}</span>
                        <div>
                          <Badge className={`${getMoodColor(entry.mood)} border text-xs`}>{entry.mood}</Badge>
                          <p className="text-xs text-gray-500 mt-1">{entry.timestamp.toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600 max-w-xs truncate">"{entry.transcript}"</p>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Test Examples */}
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
          <CardHeader>
            <CardTitle className="text-center">Try These Examples</CardTitle>
            <CardDescription className="text-center">Click to test with sample inputs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {[
                "I feel so overwhelmed with everything going on in my life right now",
                "I'm excited about my new job but also really nervous",
                "I've been feeling down lately and could use some encouragement",
                "I'm stressed about my upcoming presentation tomorrow",
              ].map((example, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="text-left h-auto p-3 whitespace-normal"
                  onClick={() => {
                    if (useTextInput) {
                      setTextInput(example)
                    } else {
                      setTranscript(example)
                    }
                  }}
                  disabled={isProcessing}
                >
                  "{example}"
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
