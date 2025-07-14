"use client"

import { useState, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, ImageIcon, Sparkles, Loader2, X, AlertCircle, Moon, Sun, Minimize2, Maximize2, Clock, AlertTriangle, CheckCircle, MapPin, Ruler, Layers, Zap } from "lucide-react"
import Image from "next/image"
import ReactMarkdown from "react-markdown"
import { useTheme } from "next-themes"

// Define types for better type safety
interface Issue {
  type: string
  category: string
  location: string
  size_description: string
  severity: 'minor' | 'moderate' | 'severe' | 'critical'
  blocking_traffic: boolean
  safety_risk: string
  urgency: 'immediate' | 'within_24h' | 'within_week' | 'routine_maintenance'
  additional_notes: string
}

interface OverallAssessment {
  condition_rating: 'excellent' | 'good' | 'fair' | 'poor' | 'dangerous'
  priority_action: string
  estimated_cleanup_time: string
  weather_impact: 'none' | 'low' | 'moderate' | 'high'
}

interface AnalysisResult {
  overall_assessment: OverallAssessment
  issue_count: number
  categories_detected: string[]
  issues: Issue[]
  recommendations: string[]
  tags: string[]
  summary: string
  detailed_description: string
}

export default function ImageAnalyzer() {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState<string | null>(null)
  const [parsedAnalysis, setParsedAnalysis] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRightPanelMaximized, setIsRightPanelMaximized] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [userDetails, setUserDetails] = useState('');
  const [userContext, setUserContext] = useState<any>(null)
  const { theme, setTheme } = useTheme()

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file && file.type.startsWith("image/")) {
      setUploadedImage(file)
      setAnalysis(null)
      setError(null)

      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    multiple: false,
  })

  const clearImage = () => {
    setUploadedImage(null)
    setImagePreview(null)
    setAnalysis(null)
    setError(null)
  }

  const analyzeImage = async () => {
    if (!uploadedImage) return

    setIsAnalyzing(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append("image", uploadedImage)
      if (userDetails.trim()) {
        formData.append("description", userDetails.trim())
      }

      const response = await fetch("/api/analyze-image", {
        method: "POST",
        body: formData,
      })

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text()
        console.error("Non-JSON response:", textResponse)
        throw new Error("Server returned an invalid response format")
      }

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`)
      }

      if (!data.analysis) {
        throw new Error("No analysis received from server")
      }

      // Handle both old and new response formats
      const analysisData = data.analysis
      setAnalysis(typeof analysisData === 'string' ? analysisData : JSON.stringify(analysisData, null, 2))
      
      // Try to parse the analysis
      let parsedData = null
      if (typeof analysisData === 'object') {
        parsedData = analysisData
      } else {
        let cleanAnalysis = analysisData.trim()
        if (cleanAnalysis.startsWith('```json')) {
          cleanAnalysis = cleanAnalysis.replace(/^```json/, '').replace(/```$/, '').trim()
        } else if (cleanAnalysis.startsWith('```')) {
          cleanAnalysis = cleanAnalysis.replace(/^```/, '').replace(/```$/, '').trim()
        }
        try {
          parsedData = JSON.parse(cleanAnalysis)
        } catch (e) {
          console.error("Failed to parse analysis:", e)
        }
      }
      
      setParsedAnalysis(parsedData)
      setUserContext(data?.user_context)
    } catch (error) {
      console.error("Error analyzing image:", error)

      let errorMessage = "An unexpected error occurred"

      if (error instanceof Error) {
        if (error.message.includes("Failed to fetch")) {
          errorMessage = "Network error. Please check your connection and try again."
        } else if (error.message.includes("invalid response format")) {
          errorMessage = "Server error. Please try again in a moment."
        } else {
          errorMessage = error.message
        }
      }

      setError(errorMessage)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const toggleRightPanel = () => {
    setIsRightPanelMaximized(!isRightPanelMaximized)
  }

  // Helper functions for dynamic styling
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-[#e6f3fc] text-[#0a1e46] border-[#e6f3fc] dark:bg-[#0a1e46]/30 dark:text-[#e6f3fc] dark:border-[#545454]'
      case 'severe': return 'bg-[#e6f3fc] text-[#0a1e46] border-[#e6f3fc] dark:bg-[#0a1e46]/30 dark:text-[#e6f3fc] dark:border-[#545454]'
      case 'moderate': return 'bg-[#e6f3fc] text-[#0a1e46] border-[#e6f3fc] dark:bg-[#0a1e46]/30 dark:text-[#e6f3fc] dark:border-[#545454]'
      case 'minor': return 'bg-[#e6f3fc] text-[#0a1e46] border-[#e6f3fc] dark:bg-[#0a1e46]/30 dark:text-[#e6f3fc] dark:border-[#545454]'
      default: return 'bg-[#e6f3fc] text-[#0a1e46] border-[#e6f3fc] dark:bg-[#0a1e46]/30 dark:text-[#e6f3fc] dark:border-[#545454]'
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'immediate': return 'bg-[#0a1e46] text-[#ffffff]'
      case 'within_24h': return 'bg-[#0a1e46] text-[#ffffff]'
      case 'within_week': return 'bg-[#0a1e46] text-[#ffffff]'
      case 'routine_maintenance': return 'bg-[#0a1e46] text-[#ffffff]'
      default: return 'bg-[#0a1e46] text-[#ffffff]'
    }
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'text-[#0a1e46] dark:text-[#e6f3fc]'
      case 'good': return 'text-[#0a1e46] dark:text-[#e6f3fc]'
      case 'fair': return 'text-[#0a1e46] dark:text-[#e6f3fc]'
      case 'poor': return 'text-[#0a1e46] dark:text-[#e6f3fc]'
      case 'dangerous': return 'text-[#0a1e46] dark:text-[#e6f3fc]'
      default: return 'text-[#0a1e46] dark:text-[#e6f3fc]'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'structural': return <Layers className="w-4 h-4" />
      case 'garbage': return <AlertTriangle className="w-4 h-4" />
      case 'obstacle': return <AlertCircle className="w-4 h-4" />
      case 'infrastructure': return <Zap className="w-4 h-4" />
      case 'vegetation': return <CheckCircle className="w-4 h-4" />
      case 'safety': return <AlertTriangle className="w-4 h-4" />
      default: return <MapPin className="w-4 h-4" />
    }
  }

  // Helper to generate markdown for potholes if present
  function getPotholesMarkdown(potholesSummary: any): string | null {
    return "";
  }

  // Helper to render user context details in a general way
  function renderUserContext(userContext: any) {
    // If userContext has a 'description' field that is a JSON string (possibly with code block markers), parse it
    let parsed = userContext;
    if (typeof userContext?.description === 'string') {
      let desc = userContext.description.trim();
      if (desc.startsWith('```json')) desc = desc.replace(/^```json/, '').replace(/```$/, '').trim();
      else if (desc.startsWith('```')) desc = desc.replace(/^```/, '').replace(/```$/, '').trim();
      try {
        parsed = JSON.parse(desc);
      } catch {
        // fallback: show as string
        parsed = { description: userContext.description };
      }
    }
    if (typeof parsed !== 'object' || !parsed) return null;
    const entries = Object.entries(parsed).filter(([_, v]) => v != null && v !== '');
    if (entries.length === 0) return null;
    return (
      <div className="mt-8 bg-[#e6f3fc] dark:bg-[#0a1e46]/30 border border-[#e6f3fc] dark:border-[#545454] rounded-xl p-4">
        <h4 className="text-lg font-bold text-[#0a1e46] dark:text-[#e6f3fc] mb-2">Complaint Details</h4>
        <dl className="divide-y divide-[#e6f3fc] dark:divide-[#545454]">
          {entries.map(([key, value]) => (
            <div key={key} className="py-2 flex flex-col md:flex-row md:items-center md:gap-2">
              <dt className="font-medium text-[#0a1e46] dark:text-[#e6f3fc] capitalize min-w-[120px]">
                {key.replace(/_/g, ' ')}:
              </dt>
              <dd className="text-[#0a1e46] dark:text-[#e6f3fc] whitespace-pre-line break-words flex-1">
                {Array.isArray(value) ? value.join(', ') : typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    );
  }

  // Don't render theme-dependent content until mounted
  if (!mounted) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gradient-to-br from-[#e6f3fc] via-[#f8fbff] to-[#bcdcf6] dark:from-[#1a2747] dark:via-[#232b3b] dark:to-[#0a1e46] flex flex-col overflow-hidden transition-colors duration-300">
      {/* Header */}
      <div className="flex-shrink-0 py-8 px-4 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Logo" width={48} height={48} className="rounded-lg" />
            <div className="inline-flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[#0a1e46] dark:text-[#e6f3fc]">
                Complainer Routing
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="border-[#e6f3fc] dark:border-[#545454] hover:bg-[#e6f3fc] dark:hover:bg-[#545454] transition-all duration-200"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-[#e6f3fc] transition-transform duration-200 rotate-0 scale-100" />
              ) : (
                <Moon className="h-4 w-4 text-[#0a1e46] transition-transform duration-200 rotate-0 scale-100" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 pb-4 min-h-0 relative">
        <div
          className={`h-full transition-all duration-700 ease-in-out ${
            isRightPanelMaximized ? "grid grid-cols-1 gap-0" : "grid lg:grid-cols-2 gap-8"
          }`}
        >
          {/* Left Panel - Upload Area */}
          <div
            className={`flex flex-col space-y-6 min-h-0 transition-all duration-700 ease-in-out ${
              isRightPanelMaximized
                ? "opacity-0 scale-95 pointer-events-none absolute inset-0 z-0"
                : "opacity-100 scale-100 pointer-events-auto relative z-10"
            }`}
          >
            <div className="mb-4">
              <label htmlFor="user-details" className="block text-sm font-medium text-[#0a1e46] dark:text-[#e6f3fc] mb-1">Your Name & Complaint (optional)</label>
              <textarea
                id="user-details"
                className="w-full rounded-lg border border-[#0a1e46] dark:border-[#545454] bg-[#ffffff]/60 dark:bg-[#0a1e46]/60 p-2 text-sm text-[#0a1e46] dark:text-[#e6f3fc] focus:outline-none focus:ring-2 focus:ring-[#0a1e46] resize-none min-h-[60px]"
                placeholder="Enter your name and message (e.g., 'John Doe: Reporting a large pothole near the school gate')"
                value={userDetails}
                onChange={e => setUserDetails(e.target.value)}
              />
            </div>
            <Card className="flex-1 overflow-hidden border-2 border-dashed border-[#0a1e46] dark:border-[#545454] hover:border-[#0a1e46] dark:hover:border-[#0a1e46] transition-all duration-300 bg-[#ffffff]/30 dark:bg-[#0a1e46]/30 backdrop-blur-lg">
              <CardContent className="p-0 h-full">
                <div
                  {...getRootProps()}
                  className={`relative p-12 text-center cursor-pointer transition-all duration-300 h-full flex flex-col justify-center ${
                    isDragActive
                      ? "bg-[#0a1e46] dark:bg-[#0a1e46]/20 border-[#0a1e46] dark:border-[#0a1e46] scale-[1.02]"
                      : "hover:bg-[#e6f3fc] dark:hover:bg-[#545454]/50"
                  }`}
                >
                  <input {...getInputProps()} />

                  {imagePreview ? (
                    <div className="space-y-4">
                      <div className="relative w-full max-w-md mx-auto aspect-square rounded-lg overflow-hidden shadow-lg group">
                        <Image
                          src={imagePreview || "/placeholder.svg"}
                          alt="Uploaded preview"
                          fill
                          className="object-cover"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            clearImage()
                          }}
                          className="absolute top-2 right-2 w-8 h-8 bg-[#0a1e46] hover:bg-[#0a1e46] text-[#ffffff] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-[#0a1e46] dark:text-[#e6f3fc]">Click to replace or drag a new image</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div
                        className={`mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-[#0a1e46] to-[#e6f3fc] dark:from-[#0a1e46]/50 dark:to-[#e6f3fc]/50 flex items-center justify-center transition-transform duration-300 ${
                          isDragActive ? "scale-110" : ""
                        }`}
                      >
                        <Upload
                          className={`w-8 h-8 text-[#0a1e46] dark:text-[#e6f3fc] transition-transform duration-300 ${
                            isDragActive ? "scale-110" : ""
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-[#0a1e46] dark:text-[#e6f3fc] mb-2">
                          {isDragActive ? "Drop your road image here" : "Upload Road Image for Analysis"}
                        </p>
                        <p className="text-sm text-[#0a1e46] dark:text-[#e6f3fc]">
                          Potholes • Garbage • Obstacles • Infrastructure Issues
                        </p>
                        <p className="text-xs text-[#0a1e46] dark:text-[#e6f3fc] mt-2">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {uploadedImage && (
              <div className="animate-in slide-in-from-bottom-4 duration-500 flex-shrink-0">
                <Button
                  onClick={analyzeImage}
                  disabled={isAnalyzing}
                  className="w-full h-12 bg-gradient-to-r from-[#0a1e46] to-[#e6f3fc] hover:from-[#0a1e46] hover:to-[#e6f3fc] dark:from-[#0a1e46] dark:to-[#e6f3fc] dark:hover:from-[#0a1e46] dark:hover:to-[#e6f3fc] text-[#ffffff] font-medium rounded-lg transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing Road Conditions...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" />
                      Analyze Road Conditions
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Right Panel - Results */}
          <div
            className={`flex flex-col min-h-0 transition-all duration-700 ease-in-out ${
              isRightPanelMaximized ? "col-span-1 scale-100 opacity-100" : "scale-100 opacity-100"
            }`}
          >
            <Card className="flex-1 border-none bg-[#ffffff]/80 dark:bg-[#545454]/80 backdrop-blur-sm flex flex-col min-h-0">
              <CardContent className="p-6 rounded-xl border-[#e6f3fc] dark:border-[#545454] border flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-6 h-6 text-[#0a1e46] dark:text-[#e6f3fc]" />
                    <h2 className="text-xl font-semibold text-[#0a1e46] dark:text-[#e6f3fc]">Analysis Report</h2>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleRightPanel}
                    className="border-[#0a1e46] dark:border-[#545454] hover:bg-[#e6f3fc] dark:hover:bg-[#545454] bg-transparent transition-all duration-200 hover:scale-105"
                  >
                    <div className="transition-transform duration-300">
                      {isRightPanelMaximized ? (
                        <Minimize2 className="h-4 w-4 text-[#0a1e46] dark:text-[#e6f3fc] transition-transform duration-300 rotate-0" />
                      ) : (
                        <Maximize2 className="h-4 w-4 text-[#0a1e46] dark:text-[#e6f3fc] transition-transform duration-300 rotate-0" />
                      )}
                    </div>
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-[#0a1e46] dark:scrollbar-thumb-[#545454] scrollbar-track-[#e6f3fc] dark:scrollbar-track-[#545454]">
                  {isAnalyzing ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center space-y-6">
                        <div className="relative w-20 h-20 mx-auto">
                          <div className="absolute inset-0 rounded-full border-4 border-[#e6f3fc] dark:border-[#545454]"></div>
                          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#0a1e46] dark:border-t-[#e6f3fc] animate-spin"></div>
                          <div className="absolute inset-2 rounded-full bg-gradient-to-r from-[#0a1e46] to-[#e6f3fc] dark:from-[#0a1e46] dark:to-[#e6f3fc] animate-pulse opacity-20"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-[#0a1e46] dark:text-[#e6f3fc] animate-pulse" />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-2 h-2 bg-[#0a1e46] dark:bg-[#e6f3fc] rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-[#0a1e46] dark:bg-[#e6f3fc] rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                            <div className="w-2 h-2 bg-[#0a1e46] dark:bg-[#e6f3fc] rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                          </div>
                          <p className="text-lg font-medium text-[#0a1e46] dark:text-[#e6f3fc]">AI Analyzing Road Conditions...</p>
                          <p className="text-sm text-[#0a1e46] dark:text-[#e6f3fc]">Detecting damage, garbage, obstacles & hazards</p>
                        </div>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center space-y-4 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                        <div className="w-16 h-16 mx-auto rounded-full bg-[#e6f3fc] dark:bg-[#0a1e46]/20 flex items-center justify-center">
                          <AlertCircle className="w-8 h-8 text-[#0a1e46]" />
                        </div>
                        <div className="space-y-3">
                          <p className="text-lg font-medium text-[#0a1e46] dark:text-[#e6f3fc]">Analysis Failed</p>
                          <p className="text-sm text-[#0a1e46] dark:text-[#e6f3fc] max-w-md mx-auto">{error}</p>
                          <Button
                            onClick={() => {
                              setError(null)
                              if (uploadedImage) analyzeImage()
                            }}
                            variant="outline"
                            className="mt-4 border-[#0a1e46] dark:border-[#545454] text-[#0a1e46] dark:text-[#e6f3fc] hover:bg-[#e6f3fc] dark:hover:bg-[#0a1e46]/20"
                          >
                            Try Again
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : analysis ? (
                    <div className="w-full animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
                      {parsedAnalysis ? (
                        <div className="space-y-6">
                          {/* Overall Assessment Card */}
                          {parsedAnalysis.overall_assessment && (
                            <div className="bg-[#ffffff]/90 dark:bg-[#545454]/80 shadow-lg rounded-2xl p-6 border border-[#e6f3fc] dark:border-[#545454]">
                              <h3 className="text-lg font-bold text-[#0a1e46] dark:text-[#e6f3fc] mb-4 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                Overall Road Assessment
                              </h3>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <div>
                                    <span className="text-sm text-[#0a1e46] dark:text-[#e6f3fc] block">Condition Rating</span>
                                    <span className={`text-lg font-semibold capitalize ${getConditionColor(parsedAnalysis.overall_assessment.condition_rating)}`}>
                                      {parsedAnalysis.overall_assessment.condition_rating}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-sm text-[#0a1e46] dark:text-[#e6f3fc] block">Priority Action</span>
                                    <span className="text-sm font-medium text-[#0a1e46] dark:text-[#e6f3fc] capitalize">
                                      {parsedAnalysis.overall_assessment.priority_action?.replace(/_/g, ' ')}
                                    </span>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <div>
                                    <span className="text-sm text-[#0a1e46] dark:text-[#e6f3fc] block">Cleanup Time</span>
                                    <span className="text-sm font-medium text-[#0a1e46] dark:text-[#e6f3fc]">
                                      {parsedAnalysis.overall_assessment.estimated_cleanup_time || 'Not specified'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-sm text-[#0a1e46] dark:text-[#e6f3fc] block">Weather Impact</span>
                                    <span className="text-sm font-medium text-[#0a1e46] dark:text-[#e6f3fc] capitalize">
                                      {parsedAnalysis.overall_assessment.weather_impact || 'Not assessed'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Quick Stats */}
                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-[#e6f3fc] dark:bg-[#0a1e46]/20 rounded-xl p-4 text-center border border-[#0a1e46] dark:border-[#545454]">
                              <div className="text-2xl font-bold text-[#0a1e46] dark:text-[#e6f3fc]">{parsedAnalysis.issue_count}</div>
                              <div className="text-sm text-[#0a1e46] dark:text-[#e6f3fc]">Issues Found</div>
                            </div>
                            <div className="bg-[#e6f3fc] dark:bg-[#0a1e46]/20 rounded-xl p-4 text-center border border-[#0a1e46] dark:border-[#545454]">
                              <div className="text-2xl font-bold text-[#0a1e46] dark:text-[#e6f3fc]">{parsedAnalysis.categories_detected?.length || 0}</div>
                              <div className="text-sm text-[#0a1e46] dark:text-[#e6f3fc]">Categories</div>
                            </div>
                            <div className="bg-[#e6f3fc] dark:bg-[#0a1e46]/20 rounded-xl p-4 text-center border border-[#0a1e46] dark:border-[#545454]">
                              <div className="text-2xl font-bold text-[#0a1e46] dark:text-[#e6f3fc]">{parsedAnalysis.recommendations?.length || 0}</div>
                              <div className="text-sm text-[#0a1e46] dark:text-[#e6f3fc]">Actions</div>
                            </div>
                          </div>

                          {/* Categories Detected */}
                          {parsedAnalysis.categories_detected && parsedAnalysis.categories_detected.length > 0 && (
                            <div className="bg-[#ffffff]/90 dark:bg-[#545454]/80 shadow-lg rounded-2xl p-6 border border-[#e6f3fc] dark:border-[#545454]">
                              <h3 className="text-lg font-bold text-[#0a1e46] dark:text-[#e6f3fc] mb-4 flex items-center gap-2">
                                <Layers className="w-5 h-5" />
                                Issue Categories Detected
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {parsedAnalysis.categories_detected.map((category, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-2 px-3 py-2 bg-[#e6f3fc] text-[#0a1e46] dark:bg-[#0a1e46]/30 dark:text-[#e6f3fc] rounded-lg text-sm font-medium capitalize border border-[#0a1e46] dark:border-[#545454]"
                                  >
                                    {getCategoryIcon(category)}
                                    {category.replace(/_/g, ' ')}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Issues Details */}
                          {parsedAnalysis.issues && parsedAnalysis.issues.length > 0 && (
                            <div className="bg-[#ffffff]/90 dark:bg-[#545454]/80 shadow-lg rounded-2xl p-6 border border-[#e6f3fc] dark:border-[#545454]">
                              <h3 className="text-lg font-bold text-[#0a1e46] dark:text-[#e6f3fc] mb-4 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                Detailed Issue Analysis
                              </h3>
                              <div className="space-y-4">
                                {parsedAnalysis.issues.map((issue, idx) => (
                                  <div
                                    key={idx}
                                    className={`rounded-xl p-5 border-2 ${getSeverityColor(issue.severity)} transition-all duration-200 hover:shadow-md`}
                                  >
                                    <div className="flex items-start justify-between mb-3">
                                      <div className="flex items-center gap-3">
                                        <span className="text-lg font-semibold">
                                          {idx + 1}. {issue.type?.charAt(0).toUpperCase() + issue.type?.slice(1)}
                                        </span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(issue.urgency)}`}>
                                          {issue.urgency?.replace(/_/g, ' ').toUpperCase()}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        {getCategoryIcon(issue.category)}
                                        <span className="text-sm font-medium capitalize">{issue.category}</span>
                                      </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <MapPin className="w-4 h-4 text-[#0a1e46]" />
                                          <span className="font-medium">Location:</span>
                                          <span>{issue.location}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Ruler className="w-4 h-4 text-[#0a1e46]" />
                                          <span className="font-medium">Size:</span>
                                          <span>{issue.size_description}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <AlertTriangle className="w-4 h-4 text-[#0a1e46]" />
                                          <span className="font-medium">Blocking Traffic:</span>
                                          <span className={issue.blocking_traffic ? 'text-[#0a1e46] font-semibold' : 'text-[#0a1e46]'}>
                                            {issue.blocking_traffic ? 'Yes' : 'No'}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <div>
                                          <span className="font-medium">Safety Risk:</span>
                                          <p className="text-[#0a1e46] dark:text-[#e6f3fc] mt-1">{issue.safety_risk}</p>
                                        </div>
                                        {issue.additional_notes && (
                                          <div>
                                            <span className="font-medium">Notes:</span>
                                            <p className="text-[#0a1e46] dark:text-[#e6f3fc] mt-1">{issue.additional_notes}</p>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Recommendations */}
                          {parsedAnalysis.recommendations && parsedAnalysis.recommendations.length > 0 && (
                            <div className="bg-[#ffffff]/90 dark:bg-[#545454]/80 shadow-lg rounded-2xl p-6 border border-[#e6f3fc] dark:border-[#545454]">
                              <h3 className="text-lg font-bold text-[#0a1e46] dark:text-[#e6f3fc] mb-4 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                Recommended Actions
                              </h3>
                              <div className="space-y-3">
                                {parsedAnalysis.recommendations.map((recommendation, idx) => (
                                  <div key={idx} className="flex items-start gap-3 p-3 bg-[#e6f3fc] dark:bg-[#0a1e46]/20 rounded-lg border border-[#0a1e46] dark:border-[#545454]">
                                    <div className="w-6 h-6 bg-[#0a1e46] text-[#ffffff] rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                                      {idx + 1}
                                    </div>
                                    <p className="text-[#0a1e46] dark:text-[#e6f3fc] font-medium">{recommendation}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Tags */}
                          {parsedAnalysis.tags && parsedAnalysis.tags.length > 0 && (
                            <div className="bg-[#ffffff]/90 dark:bg-[#545454]/80 shadow-lg rounded-2xl p-6 border border-[#e6f3fc] dark:border-[#545454]">
                              <h3 className="text-lg font-bold text-[#0a1e46] dark:text-[#e6f3fc] mb-4">Issue Tags</h3>
                              <div className="flex flex-wrap gap-2">
                                {parsedAnalysis.tags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-block bg-[#e6f3fc] text-[#0a1e46] dark:bg-[#545454] dark:text-[#e6f3fc] rounded-full px-3 py-1 text-sm font-medium border border-[#0a1e46] dark:border-[#545454]"
                                  >
                                    #{tag.replace(/\s+/g, '')}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Summary and Detailed Description */}
                          {(parsedAnalysis.summary || parsedAnalysis.detailed_description) && (
                            <div className="bg-[#ffffff]/90 dark:bg-[#545454]/80 shadow-xl rounded-2xl p-6 border border-[#e6f3fc] dark:border-[#545454]">
                              {parsedAnalysis.summary && (
                                <div className="mb-6">
                                  <h3 className="text-lg font-bold text-[#0a1e46] dark:text-[#e6f3fc] mb-3">Executive Summary</h3>
                                  <p className="text-[#0a1e46] dark:text-[#e6f3fc] text-base leading-relaxed bg-[#e6f3fc] dark:bg-[#0a1e46]/20 p-4 rounded-lg border border-[#0a1e46] dark:border-[#545454]">
                                    {parsedAnalysis.summary}
                                  </p>
                                </div>
                              )}
                              {parsedAnalysis.detailed_description && (
                                <div>
                                  <h3 className="text-lg font-bold text-[#0a1e46] dark:text-[#e6f3fc] mb-3">Detailed Analysis</h3>
                                  <div className="prose prose-[#0a1e46] dark:prose-invert max-w-none">
                                    <ReactMarkdown
                                      components={{
                                        p: ({ children }) => (
                                          <p className="mb-4 text-[#0a1e46] dark:text-[#e6f3fc] leading-relaxed">{children}</p>
                                        ),
                                        strong: ({ children }) => (
                                          <strong className="font-semibold text-[#0a1e46] dark:text-[#e6f3fc]">{children}</strong>
                                        ),
                                        h1: ({ children }) => (
                                          <h1 className="text-xl font-bold text-[#0a1e46] dark:text-[#e6f3fc] mb-3 mt-6 first:mt-0">
                                            {children}
                                          </h1>
                                        ),
                                        h2: ({ children }) => (
                                          <h2 className="text-lg font-semibold text-[#0a1e46] dark:text-[#e6f3fc] mb-3 mt-5 first:mt-0">
                                            {children}
                                          </h2>
                                        ),
                                        h3: ({ children }) => (
                                          <h3 className="text-base font-semibold text-[#0a1e46] dark:text-[#e6f3fc] mb-2 mt-4 first:mt-0">
                                            {children}
                                          </h3>
                                        ),
                                        ul: ({ children }) => (
                                          <ul className="list-disc list-inside mb-4 space-y-1 text-[#0a1e46] dark:text-[#e6f3fc]">
                                            {children}
                                          </ul>
                                        ),
                                        li: ({ children }) => <li className="mb-1">{children}</li>,
                                      }}
                                    >
                                      {parsedAnalysis.detailed_description + (((parsedAnalysis as any)['potholes_summary'] ?? (parsedAnalysis as any)['potholesSummary']) ? getPotholesMarkdown((parsedAnalysis as any)['potholes_summary'] ?? (parsedAnalysis as any)['potholesSummary']) || '' : '')}
                                    </ReactMarkdown>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                       {renderUserContext((userContext as any))}
                        </div>
                      ) : (
                        // Fallback for unparsed analysis
                        <div className="bg-[#ffffff]/90 dark:bg-[#545454]/80 shadow-lg rounded-2xl p-6 border border-[#e6f3fc] dark:border-[#545454]">
                          <h3 className="text-lg font-bold text-[#0a1e46] dark:text-[#e6f3fc] mb-4">Analysis Results</h3>
                          <div className="prose prose-[#0a1e46] dark:prose-invert max-w-none">
                            <ReactMarkdown>{analysis}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center space-y-4 opacity-60">
                        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-[#e6f3fc] to-[#0a1e46] dark:from-[#0a1e46]/50 dark:to-[#e6f3fc]/50 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-[#0a1e46]" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-[#0a1e46] dark:text-[#e6f3fc]">Ready to analyze road conditions</p>
                          <p className="text-sm text-[#0a1e46] dark:text-[#e6f3fc]">
                            Upload an image to detect damage, garbage, obstacles & hazards
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}