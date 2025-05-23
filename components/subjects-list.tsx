import Link from "next/link"
import { subjects } from "@/lib/data"

export default function SubjectsList() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {subjects.map((subject) => (
        <div
          key={subject.id}
          className="bg-white rounded-lg p-6 shadow-md border border-gray-100 transition-all duration-300 hover:shadow-xl hover:border-gray-200 hover:translate-y-[-4px] relative group"
        >
          <div className="flex items-center mb-4 relative">
            <div
              className={`w-10 h-10 rounded-md ${subject.iconBg} flex items-center justify-center mr-3 transform group-hover:scale-110 transition-transform duration-300`}
            >
              <span className={`${subject.iconColor}`}>{subject.icon}</span>
            </div>
            <h3 className="text-lg font-medium group-hover:text-[#1e74bb] transition-colors duration-300">
              {subject.name}
            </h3>
          </div>

          <div className="mb-4 relative">
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">{subject.progress}%</span>
              <span className="text-gray-400 text-sm">{subject.completedLessons}/19 Lessons</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`${subject.progressColor} h-2 rounded-full`}
                style={{ width: `${subject.progress}%` }}
              ></div>
            </div>
          </div>

          <Link
            href={`/subjects/${subject.id}`}
            className="inline-block bg-[#1e74bb] text-white py-2 px-4 rounded-md text-sm hover:bg-[#1a67a7] transition-colors flex items-center group-hover:bg-[#1a67a7]"
          >
            Select a topic
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 ml-2 transform group-hover:translate-x-1 transition-transform duration-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      ))}
    </div>
  )
}
