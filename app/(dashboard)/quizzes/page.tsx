"use client"
import { getSubject } from "@/lib/data"
import { api } from "@/lib/api-client"
import QuizCard from "@/components/quiz-card"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { ChevronRight } from "lucide-react"
import Link from "next/link"
import { type Key, useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"

interface Subject {

  organization_id: number
  subject_id: number
  subject_name: string
  is_active: boolean
  created_by: number
  create_date_time: number
  update_date_time: number

}

interface Topic {
  organization_id: number
  subject_id: number
  topic_id: number
  topic_name: string
  is_active: boolean
  created_by: number
  create_date_time: number
  update_date_time: number
}

export default function TopicPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [quizzes, setQuizzes] = useState<any>([])

  const searchParams = useSearchParams() // query params
  const subjectId = searchParams.get("subjectId")
  const topicId = searchParams.get("topicId")
  const topicSlug = searchParams.get("topicSlug")
  const subjectSlug = searchParams.get("subjectSlug")
  const subjectName = searchParams.get("subjectName")
  const topicName = searchParams.get("topicName")
  let subject = null as unknown as Subject;
  let topic = null as unknown as Topic;

  const organizationId = localStorage.getItem("organizationId")

  // const topic = getTopic(params.subject, params.topic)

  // if (!subject || !topic) {
  //   notFound()
  // }

  // const quizzes = getQuizzes(params.topic)


  useEffect(() => {
    const fetchProgressData = async () => {
      try {

        const userId = localStorage.getItem("userId")
        const response = await api.get<any>(`user-quiz-progress/quiz-progress/progress?user_id=${userId}&organization_id=${organizationId}&topic_slug=${topicSlug}&subject_id=${subjectId}&topic_id=${topicId}`)
        const data = await response.data
        setQuizzes(data)
      } catch (error) {
        console.error("Error fetching progress data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchProgressData()
  }, [])

  // useEffect(() => {
  //   const fetchProgressData = async () => {
  //     try {

  //       const userId = localStorage.getItem("userId")
  //       const response = await api.get<any>(`quizzes/quizzes/by-subject-topic/${subjectId}/${topicId}?organization_id=${organizationId}`)
  //       const data = await response.data
  //       setQuizzes(data)
  //     } catch (error) {
  //       console.error("Error fetching progress data:", error)
  //     } finally {
  //       setIsLoading(false)
  //     }
  //   }

  //   fetchProgressData()
  // }, [])

  // Icons for different quiz types
  const quizIcons = ["📊", "📈", "📏", "🧮", "📚", "🔍", "🧩", "🎯"]

  // Background colors for icons
  const iconBgs = [
    "bg-blue-100",
    "bg-green-100",
    "bg-yellow-100",
    "bg-purple-100",
    "bg-pink-100",
    "bg-indigo-100",
    "bg-red-100",
    "bg-orange-100",
  ]

  // Progress bar colors
  const progressColors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-yellow-500",
    "bg-red-500",
    "bg-indigo-500",
    "bg-pink-500",
    "bg-orange-500",
  ]

  return (
    <div>
      <div className="bg-[#1e74bb] text-white px-8 py-6 relative">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link className="text-white text-md font-semibold" href="/">
                  Home
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              {/* <ChevronRight className="h-4 w-4" /> */}
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link className="text-white text-md font-semibold" href={`/topics?subjectId=${subjectId}&subjectSlug=${subjectSlug}&subjectName=${subjectName}`}>
                  {subjectName}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              {/* <ChevronRight className="h-4 w-4" /> */}
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink className="text-white text-md font-semibold" >{topicName}</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="p-6">
        <h1 className="text-2xl font-medium text-gray-600 mb-6">Select a quiz to test your knowledge</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {quizzes.map(
            (
              quiz: {
                is_completed: any
                quiz_id: Key | null | undefined
                title: string
                description: any
                total_questions: any
                time_limit: any
                level: any
                icon: any
                iconBg: any
                progress_percentage: any
                progressColor: any
                completed_questions: any
              },
              index: number,
            ) => (
              <QuizCard
                key={quiz.quiz_id}
                title={quiz.title}
                description={quiz.description || "Test your knowledge with this quiz on "}
                questions={quiz.total_questions}
                time={quiz.time_limit}
                difficulty={quiz.level || "Beginner"}
                href={`/quiz?quizId=${quiz.quiz_id}&subjectId=${subjectId}&topicId=${topicId}&topicSlug=${topicSlug}&subjectSlug=${subjectSlug}&quizName=${quiz.title}&subjectName=${subjectName}&topicName=${topicName}&totalQuizQuestions=${quiz.total_questions}`}
                icon={quiz.icon || quizIcons[index % quizIcons.length]}
                iconBg={quiz.iconBg || iconBgs[index % iconBgs.length]}
                progress={quiz.progress_percentage} // Use quiz progress or generate random for demo
                progressColor={quiz.progressColor || progressColors[index % progressColors.length]}
                completedQuestions={quiz.completed_questions}
                totalQuestions={quiz.total_questions}
                isCompleted={quiz.is_completed}
              />
            ),
          )}
        </div>
      </div>
    </div>
  )
}
