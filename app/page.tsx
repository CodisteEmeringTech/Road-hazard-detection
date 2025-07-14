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

      console.log("Sending request to analyze image...")

      const response = await fetch("/api/analyze-image", {
        method: "POST",
        body: formData,
      })

      console.log("Response status:", response.status)

      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text()
        console.error("Non-JSON response:", textResponse)
        throw new Error("Server returned an invalid response format")
      }

      const data = await response.json()
      console.log("Response data:", data)

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
      case 'critical': return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700'
      case 'severe': return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-200 dark:border-orange-700'
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-700'
      case 'minor': return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700'
      default: return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-200 dark:border-gray-700'
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'immediate': return 'bg-red-500 text-white'
      case 'within_24h': return 'bg-orange-500 text-white'
      case 'within_week': return 'bg-yellow-500 text-white'
      case 'routine_maintenance': return 'bg-blue-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'text-green-600 dark:text-green-400'
      case 'good': return 'text-blue-600 dark:text-blue-400'
      case 'fair': return 'text-yellow-600 dark:text-yellow-400'
      case 'poor': return 'text-orange-600 dark:text-orange-400'
      case 'dangerous': return 'text-red-600 dark:text-red-400'
      default: return 'text-gray-600 dark:text-gray-400'
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

  // Don't render theme-dependent content until mounted
  if (!mounted) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900 flex flex-col overflow-hidden transition-colors duration-300">
      {/* Header */}
      <div className="flex-shrink-0 py-8 px-4 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Logo" width={48} height={48} className="rounded-lg" />
            <div className="inline-flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                Road Inspector AI
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="border-red-200 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-gray-700 transition-all duration-200"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-yellow-500 transition-transform duration-200 rotate-0 scale-100" />
              ) : (
                <Moon className="h-4 w-4 text-red-600 transition-transform duration-200 rotate-0 scale-100" />
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
            <Card className="flex-1 overflow-hidden border-2 border-dashed border-red-200 dark:border-gray-600 hover:border-red-300 dark:hover:border-red-500 transition-all duration-300 bg-white/30 dark:bg-gray-900/30 backdrop-blur-lg">
              <CardContent className="p-0 h-full">
                <div
                  {...getRootProps()}
                  className={`relative p-12 text-center cursor-pointer transition-all duration-300 h-full flex flex-col justify-center ${
                    isDragActive
                      ? "bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-500 scale-[1.02]"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
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
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Click to replace or drag a new image</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div
                        className={`mx-auto w-16 h-16 rounded-full bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/50 dark:to-rose-900/50 flex items-center justify-center transition-transform duration-300 ${
                          isDragActive ? "scale-110" : ""
                        }`}
                      >
                        <Upload
                          className={`w-8 h-8 text-red-600 dark:text-red-400 transition-transform duration-300 ${
                            isDragActive ? "scale-110" : ""
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-2">
                          {isDragActive ? "Drop your road image here" : "Upload Road Image for Analysis"}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Potholes • Garbage • Obstacles • Infrastructure Issues
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
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
                  className="w-full h-12 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 dark:from-red-500 dark:to-rose-500 dark:hover:from-red-600 dark:hover:to-rose-600 text-white font-medium rounded-lg transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100"
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
            <Card className="flex-1 border-none bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm flex flex-col min-h-0">
              <CardContent className="p-6 rounded-xl border-red-100 dark:border-gray-700 border flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Road Analysis Report</h2>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={toggleRightPanel}
                    className="border-red-200 dark:border-gray-600 hover:bg-red-50 dark:hover:bg-gray-700 bg-transparent transition-all duration-200 hover:scale-105"
                  >
                    <div className="transition-transform duration-300">
                      {isRightPanelMaximized ? (
                        <Minimize2 className="h-4 w-4 text-red-600 dark:text-red-400 transition-transform duration-300 rotate-0" />
                      ) : (
                        <Maximize2 className="h-4 w-4 text-red-600 dark:text-red-400 transition-transform duration-300 rotate-0" />
                      )}
                    </div>
                  </Button>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 scrollbar-thin scrollbar-thumb-red-300 dark:scrollbar-thumb-gray-600 scrollbar-track-gray-100 dark:scrollbar-track-gray-800">
                  {isAnalyzing ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center space-y-6">
                        <div className="relative w-20 h-20 mx-auto">
                          <div className="absolute inset-0 rounded-full border-4 border-red-100 dark:border-gray-700"></div>
                          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-red-500 dark:border-t-red-400 animate-spin"></div>
                          <div className="absolute inset-2 rounded-full bg-gradient-to-r from-red-400 to-rose-400 dark:from-red-500 dark:to-rose-500 animate-pulse opacity-20"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Sparkles className="w-8 h-8 text-red-600 dark:text-red-400 animate-pulse" />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                            <div className="w-2 h-2 bg-red-500 dark:bg-red-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                          </div>
                          <p className="text-lg font-medium text-gray-700 dark:text-gray-200">AI Analyzing Road Conditions...</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">Detecting damage, garbage, obstacles & hazards</p>
                        </div>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center space-y-4 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                        <div className="w-16 h-16 mx-auto rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
                          <AlertCircle className="w-8 h-8 text-red-500 dark:text-red-400" />
                        </div>
                        <div className="space-y-3">
                          <p className="text-lg font-medium text-red-600 dark:text-red-400">Analysis Failed</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300 max-w-md mx-auto">{error}</p>
                          <Button
                            onClick={() => {
                              setError(null)
                              if (uploadedImage) analyzeImage()
                            }}
                            variant="outline"
                            className="mt-4 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
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
                            <div className="bg-white/90 dark:bg-gray-900/80 shadow-lg rounded-2xl p-6 border border-red-100 dark:border-red-800">
                              <h3 className="text-lg font-bold text-red-700 dark:text-red-300 mb-4 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                Overall Road Assessment
                              </h3>
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 block">Condition Rating</span>
                                    <span className={`text-lg font-semibold capitalize ${getConditionColor(parsedAnalysis.overall_assessment.condition_rating)}`}>
                                      {parsedAnalysis.overall_assessment.condition_rating}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 block">Priority Action</span>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 capitalize">
                                      {parsedAnalysis.overall_assessment.priority_action?.replace(/_/g, ' ')}
                                    </span>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 block">Cleanup Time</span>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                                      {parsedAnalysis.overall_assessment.estimated_cleanup_time || 'Not specified'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 block">Weather Impact</span>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200 capitalize">
                                      {parsedAnalysis.overall_assessment.weather_impact || 'Not assessed'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Quick Stats */}
                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center border border-blue-200 dark:border-blue-800">
                              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{parsedAnalysis.issue_count}</div>
                              <div className="text-sm text-blue-700 dark:text-blue-300">Issues Found</div>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 text-center border border-purple-200 dark:border-purple-800">
                              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{parsedAnalysis.categories_detected?.length || 0}</div>
                              <div className="text-sm text-purple-700 dark:text-purple-300">Categories</div>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center border border-green-200 dark:border-green-800">
                              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{parsedAnalysis.recommendations?.length || 0}</div>
                              <div className="text-sm text-green-700 dark:text-green-300">Actions</div>
                            </div>
                          </div>

                          {/* Categories Detected */}
                          {parsedAnalysis.categories_detected && parsedAnalysis.categories_detected.length > 0 && (
                            <div className="bg-white/90 dark:bg-gray-900/80 shadow-lg rounded-2xl p-6 border border-red-100 dark:border-red-800">
                              <h3 className="text-lg font-bold text-red-700 dark:text-red-300 mb-4 flex items-center gap-2">
                                <Layers className="w-5 h-5" />
                                Issue Categories Detected
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {parsedAnalysis.categories_detected.map((category, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-2 px-3 py-2 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 rounded-lg text-sm font-medium capitalize border border-red-200 dark:border-red-700"
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
                            <div className="bg-white/90 dark:bg-gray-900/80 shadow-lg rounded-2xl p-6 border border-red-100 dark:border-red-800">
                              <h3 className="text-lg font-bold text-red-700 dark:text-red-300 mb-4 flex items-center gap-2">
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
                                          <MapPin className="w-4 h-4 text-gray-500" />
                                          <span className="font-medium">Location:</span>
                                          <span>{issue.location}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <Ruler className="w-4 h-4 text-gray-500" />
                                          <span className="font-medium">Size:</span>
                                          <span>{issue.size_description}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <AlertTriangle className="w-4 h-4 text-gray-500" />
                                          <span className="font-medium">Blocking Traffic:</span>
                                          <span className={issue.blocking_traffic ? 'text-red-600 font-semibold' : 'text-green-600'}>
                                            {issue.blocking_traffic ? 'Yes' : 'No'}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="space-y-2">
                                        <div>
                                          <span className="font-medium">Safety Risk:</span>
                                          <p className="text-gray-700 dark:text-gray-300 mt-1">{issue.safety_risk}</p>
                                        </div>
                                        {issue.additional_notes && (
                                          <div>
                                            <span className="font-medium">Notes:</span>
                                            <p className="text-gray-700 dark:text-gray-300 mt-1">{issue.additional_notes}</p>
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
                            <div className="bg-white/90 dark:bg-gray-900/80 shadow-lg rounded-2xl p-6 border border-red-100 dark:border-red-800">
                              <h3 className="text-lg font-bold text-red-700 dark:text-red-300 mb-4 flex items-center gap-2">
                                <CheckCircle className="w-5 h-5" />
                                Recommended Actions
                              </h3>
                              <div className="space-y-3">
                                {parsedAnalysis.recommendations.map((recommendation, idx) => (
                                  <div key={idx} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                                      {idx + 1}
                                    </div>
                                    <p className="text-green-800 dark:text-green-200 font-medium">{recommendation}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Tags */}
                          {parsedAnalysis.tags && parsedAnalysis.tags.length > 0 && (
                            <div className="bg-white/90 dark:bg-gray-900/80 shadow-lg rounded-2xl p-6 border border-red-100 dark:border-red-800">
                              <h3 className="text-lg font-bold text-red-700 dark:text-red-300 mb-4">Issue Tags</h3>
                              <div className="flex flex-wrap gap-2">
                                {parsedAnalysis.tags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-block bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 rounded-full px-3 py-1 text-sm font-medium border border-gray-200 dark:border-gray-700"
                                  >
                                    #{tag.replace(/\s+/g, '')}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Summary and Detailed Description */}
                          {(parsedAnalysis.summary || parsedAnalysis.detailed_description) && (
                            <div className="bg-white/90 dark:bg-gray-900/80 shadow-xl rounded-2xl p-6 border border-red-100 dark:border-red-800">
                              {parsedAnalysis.summary && (
                                <div className="mb-6">
                                  <h3 className="text-lg font-bold text-red-700 dark:text-red-300 mb-3">Executive Summary</h3>
                                  <p className="text-gray-700 dark:text-gray-200 text-base leading-relaxed bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                                    {parsedAnalysis.summary}
                                  </p>
                                </div>
                              )}
                              {parsedAnalysis.detailed_description && (
                                <div>
                                  <h3 className="text-lg font-bold text-red-700 dark:text-red-300 mb-3">Detailed Analysis</h3>
                                  <div className="prose prose-red dark:prose-invert max-w-none">
                                    <ReactMarkdown
                                      components={{
                                        p: ({ children }) => (
                                          <p className="mb-4 text-gray-700 dark:text-gray-200 leading-relaxed">{children}</p>
                                        ),
                                        strong: ({ children }) => (
                                          <strong className="font-semibold text-gray-800 dark:text-gray-100">{children}</strong>
                                        ),
                                        h1: ({ children }) => (
                                          <h1 className="text-xl font-bold text-red-800 dark:text-red-200 mb-3 mt-6 first:mt-0">
                                            {children}
                                          </h1>
                                        ),
                                        h2: ({ children }) => (
                                          <h2 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-3 mt-5 first:mt-0">
                                            {children}
                                          </h2>
                                        ),
                                        h3: ({ children }) => (
                                          <h3 className="text-base font-semibold text-red-700 dark:text-red-300 mb-2 mt-4 first:mt-0">
                                            {children}
                                          </h3>
                                        ),
                                        ul: ({ children }) => (
                                          <ul className="list-disc list-inside mb-4 space-y-1 text-gray-700 dark:text-gray-300">
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
                        </div>
                      ) : (
                        // Fallback for unparsed analysis
                        <div className="bg-white/90 dark:bg-gray-900/80 shadow-lg rounded-2xl p-6 border border-red-100 dark:border-red-800">
                          <h3 className="text-lg font-bold text-red-700 dark:text-red-300 mb-4">Analysis Results</h3>
                          <div className="prose prose-gray dark:prose-invert max-w-none">
                            <ReactMarkdown>{analysis}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center space-y-4 opacity-60">
                        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-red-100 to-rose-100 dark:from-red-900/50 dark:to-rose-900/50 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-red-400 dark:text-red-500" />
                        </div>
                        <div>
                          <p className="text-lg font-medium text-gray-500 dark:text-gray-400">Ready to analyze road conditions</p>
                          <p className="text-sm text-gray-400 dark:text-gray-500">
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