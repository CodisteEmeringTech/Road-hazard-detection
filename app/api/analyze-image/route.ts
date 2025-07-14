import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: "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",
})

export async function POST(request: NextRequest) {
  try {
    // Validate request
    if (!request.body) {
      return NextResponse.json({ error: "No request body provided" }, { status: 400 })
    }

    const formData = await request.formData()
    const image = formData.get("image") as File
    const complaintType = formData.get("complaintType") as string // Optional: user can specify complaint type
    const location = formData.get("location") as string // Optional: location info
    const description = formData.get("description") as string // Optional: user description

    if (!image) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 })
    }

    // Validate file type
    if (!image.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (image.size > maxSize) {
      return NextResponse.json({ error: "Image file too large. Maximum size is 10MB" }, { status: 400 })
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer()
    const base64 = Buffer.from(bytes).toString("base64")
    const mimeType = image.type

    // Validate API key
    if (!process.env.OPENAI_API_KEY) {
      console.error("OpenAI API key not configured")
      return NextResponse.json({ error: "AI service not configured" }, { status: 500 })
    }

    console.log("Starting comprehensive road analysis...")

    // Build context-aware prompt
    let contextualInfo = ""
    if (complaintType) {
      contextualInfo += `\nUser complaint type: ${complaintType}`
    }
    if (location) {
      contextualInfo += `\nReported location: ${location}`
    }
    if (description) {
      contextualInfo += `\nUser description: ${description}`
    }

    // Enhanced comprehensive road inspection prompt
    const analysisPrompt = `You are an expert road inspector AI designed to analyze road conditions and public complaints. Analyze the provided image comprehensively and detect ANY issues or problems related to road safety, cleanliness, and usability.

${contextualInfo}

**DETECTION CATEGORIES:**

1. **STRUCTURAL DAMAGE**: Potholes, cracks, surface wear, broken asphalt, uneven surfaces
2. **ROAD MARKINGS**: Faded lines, missing signs, damaged traffic signs, unclear markings
3. **GARBAGE & LITTER**: Trash, plastic bags, bottles, food waste, scattered debris
4. **OBSTACLES & HAZARDS**: 
   - Fallen trees, branches, rocks
   - Abandoned vehicles or parts
   - Construction materials left behind
   - Dead animals
   - Large debris blocking traffic
   - Flood water, oil spills
5. **INFRASTRUCTURE ISSUES**: 
   - Broken streetlights, damaged guardrails
   - Clogged drains, standing water
   - Damaged manholes, missing covers
   - Broken or tilted poles
6. **VEGETATION ISSUES**: Overgrown grass/weeds, branches blocking view
7. **SAFETY CONCERNS**: Any other hazards affecting pedestrians, cyclists, or vehicles

For each issue detected, provide:
- **type**: Specific issue type (e.g., "plastic bags", "pothole", "fallen branch", "standing water")
- **category**: Main category (structural, garbage, obstacle, infrastructure, vegetation, safety)
- **location**: Position in image (left, center, right, near curb, etc.)
- **size_description**: Size estimate in practical terms (small/medium/large or dimensions)
- **severity**: minor, moderate, severe, critical
- **blocking_traffic**: yes/no - Does it block or impede traffic flow?
- **safety_risk**: Specific safety concerns (vehicle damage, pedestrian hazard, etc.)
- **urgency**: immediate, within_24h, within_week, routine_maintenance
- **additional_notes**: Any other relevant observations

**OVERALL ASSESSMENT:**
- **condition_rating**: excellent, good, fair, poor, dangerous
- **priority_action**: immediate_attention, scheduled_maintenance, monitoring, no_action_needed
- **estimated_cleanup_time**: Time estimate for resolution (if applicable)

Return ONLY a JSON object with real analysis data (no placeholders):

{
  "overall_assessment": {
    "condition_rating": "fair",
    "priority_action": "scheduled_maintenance",
    "estimated_cleanup_time": "2-4 hours",
    "weather_impact": "none/low/moderate/high"
  },
  "issue_count": 3,
  "categories_detected": ["garbage", "structural", "obstacle"],
  "issues": [
    {
      "type": "plastic bags",
      "category": "garbage",
      "location": "center right",
      "size_description": "multiple large bags scattered",
      "severity": "moderate",
      "blocking_traffic": false,
      "safety_risk": "potential flying debris in wind",
      "urgency": "within_24h",
      "additional_notes": "appears to be household waste dumped illegally"
    }
  ],
  "recommendations": [
    "Schedule garbage collection within 24 hours",
    "Install no-dumping signage",
    "Repair pothole to prevent water accumulation"
  ],
  "tags": ["illegal dumping", "garbage cleanup needed", "moderate priority"],
  "summary": "Multiple issues detected requiring coordinated cleanup and maintenance response.",
  "detailed_description": "### Road Condition: Fair\n**Immediate Issues:**\n- Illegal garbage dumping requiring cleanup\n- Structural damage needs repair\n\n**Recommended Actions:**\n- Priority cleanup within 24 hours\n- Schedule road maintenance"
}

// Append this before "Respond ONLY with the JSON object - no additional text."

**POTHOLE SUMMARY:**
Return a separate key called **potholes_summary** with:
- **pothole_count**: total number of potholes detected in the image
- **potholes**: array of pothole details, each with:
  - **location**: where in image
  - **size_description**: size estimate
  - **severity**: minor, moderate, severe, critical
  - **blocking_traffic**: yes/no
  - **safety_risk**: potential risks
  - **urgency**: immediate, within_24h, within_week, routine_maintenance
  - **additional_notes**: any extra notes

If no potholes are detected, return pothole_count as 0 and potholes as an empty array.



Respond ONLY with the JSON object - no additional text.`

    // Analyze the image using OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: analysisPrompt,
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64}`,
                detail: "high",
              },
            },
          ],
        },
      ],
      max_tokens: 1500, // Increased for more comprehensive analysis
      temperature: 0.3, // Lower temperature for more consistent analysis
    })

    console.log("Comprehensive road analysis completed")

    const analysis = response.choices[0]?.message?.content

    if (!analysis || analysis.trim().length === 0) {
      console.error("No analysis content received")
      return NextResponse.json({ error: "No analysis generated" }, { status: 500 })
    }

    // Try to parse JSON to validate structure
    try {
      const parsedAnalysis = JSON.parse(analysis)
      
      // Add metadata to response
      const enhancedResponse = {
        analysis: parsedAnalysis,
        metadata: {
          timestamp: new Date().toISOString(),
          image_size: image.size,
          user_context: {
            complaint_type: complaintType || null,
            location: location || null,
            description: description || null
          }
        }
      }

      return NextResponse.json(enhancedResponse)
    } catch (parseError) {
      console.error("Failed to parse analysis JSON:", parseError)
      // Return raw analysis if JSON parsing fails
      return NextResponse.json({ analysis, raw: true })
    }

  } catch (error: any) {
    console.error("Detailed error analyzing image:", error)

    // Handle OpenAI specific errors
    if (error?.error?.type) {
      console.log(error)
      switch (error.error.type) {
        case "invalid_request_error":
          return NextResponse.json({ error: "Invalid request to AI service" }, { status: 400 })
        case "authentication_error":
          return NextResponse.json({ error: "AI service authentication failed" }, { status: 401 })
        case "permission_error":
          return NextResponse.json({ error: "Permission denied for AI service" }, { status: 403 })
        case "rate_limit_error":
          return NextResponse.json({ error: "Rate limit exceeded. Please try again in a moment" }, { status: 429 })
        case "api_error":
          return NextResponse.json({ error: "AI service temporarily unavailable" }, { status: 502 })
        case "overloaded_error":
          return NextResponse.json({ error: "AI service is overloaded. Please try again" }, { status: 503 })
        default:
          return NextResponse.json({ error: "AI service error occurred" }, { status: 500 })
      }
    }

    // Handle network and other errors
    if (error instanceof Error) {
      if (error.message.includes("fetch")) {
        return NextResponse.json({ error: "Network error. Please check your connection" }, { status: 503 })
      }
      if (error.message.includes("timeout")) {
        return NextResponse.json({ error: "Request timed out. Please try again" }, { status: 408 })
      }
      if (error.message.includes("API key")) {
        return NextResponse.json({ error: "AI service configuration error" }, { status: 500 })
      }
    }

    return NextResponse.json({ error: "Internal server error occurred" }, { status: 500 })
  }
}