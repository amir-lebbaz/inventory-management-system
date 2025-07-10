"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, PieChart, TrendingUp, Activity } from "lucide-react"

interface ChartData {
  labels: string[]
  data: number[]
  colors: string[]
}

interface ChartProps {
  title: string
  data: ChartData
  className?: string
}

export function SimpleBarChart({ title, data, className }: ChartProps) {
  const maxValue = Math.max(...data.data)

  return (
    <Card className={`shadow-lg border-0 bg-white/80 backdrop-blur ${className}`}>
      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {data.labels.map((label, index) => (
            <div key={label} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <span className="text-sm font-bold text-gray-900">{data.data[index]}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-500 ease-out"
                  style={{
                    width: `${(data.data[index] / maxValue) * 100}%`,
                    backgroundColor: data.colors[index % data.colors.length],
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function SimplePieChart({ title, data, className }: ChartProps) {
  const total = data.data.reduce((sum, value) => sum + value, 0)

  return (
    <Card className={`shadow-lg border-0 bg-white/80 backdrop-blur ${className}`}>
      <CardHeader className="bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              {data.data.map((value, index) => {
                const percentage = (value / total) * 100
                const strokeDasharray = `${percentage} ${100 - percentage}`
                const strokeDashoffset = data.data.slice(0, index).reduce((sum, val) => sum + (val / total) * 100, 0)

                return (
                  <circle
                    key={index}
                    cx="50"
                    cy="50"
                    r="15.915"
                    fill="transparent"
                    stroke={data.colors[index % data.colors.length]}
                    strokeWidth="8"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={-strokeDashoffset}
                    className="transition-all duration-500"
                  />
                )
              })}
            </svg>
          </div>
        </div>
        <div className="space-y-2">
          {data.labels.map((label, index) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: data.colors[index % data.colors.length] }}
                />
                <span className="text-sm text-gray-700">{label}</span>
              </div>
              <span className="text-sm font-medium">
                {data.data[index]} ({((data.data[index] / total) * 100).toFixed(1)}%)
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function TrendChart({ title, data, className }: ChartProps) {
  const maxValue = Math.max(...data.data)
  const minValue = Math.min(...data.data)

  return (
    <Card className={`shadow-lg border-0 bg-white/80 backdrop-blur ${className}`}>
      <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="h-40 flex items-end justify-between gap-2">
          {data.data.map((value, index) => {
            const height = ((value - minValue) / (maxValue - minValue)) * 100
            return (
              <div key={index} className="flex flex-col items-center flex-1">
                <div className="text-xs font-medium mb-1">{value}</div>
                <div
                  className="w-full rounded-t transition-all duration-500 ease-out"
                  style={{
                    height: `${height}%`,
                    backgroundColor: data.colors[index % data.colors.length],
                    minHeight: "4px",
                  }}
                />
                <div className="text-xs text-gray-600 mt-1 text-center">{data.labels[index]}</div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

export function ActivityChart({ title, data, className }: ChartProps) {
  return (
    <Card className={`shadow-lg border-0 bg-white/80 backdrop-blur ${className}`}>
      <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {data.labels.map((label, index) => (
            <div key={label} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-sm text-gray-600">{data.data[index]}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${(data.data[index] / Math.max(...data.data)) * 100}%`,
                      backgroundColor: data.colors[index % data.colors.length],
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// رسم بياني دائري متقدم
export function AdvancedPieChart({ title, data, className }: ChartProps) {
  const total = data.data.reduce((sum, value) => sum + value, 0)

  return (
    <Card className={`shadow-lg border-0 bg-white/80 backdrop-blur ${className}`}>
      <CardHeader className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="relative">
            <svg className="w-40 h-40 transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="20" fill="transparent" stroke="#f3f4f6" strokeWidth="8" />
              {data.data.map((value, index) => {
                const percentage = (value / total) * 100
                const circumference = 2 * Math.PI * 20
                const strokeDasharray = circumference
                const strokeDashoffset = circumference - (percentage / 100) * circumference
                const rotation = data.data.slice(0, index).reduce((sum, val) => sum + (val / total) * 360, 0)

                return (
                  <circle
                    key={index}
                    cx="50"
                    cy="50"
                    r="20"
                    fill="transparent"
                    stroke={data.colors[index % data.colors.length]}
                    strokeWidth="8"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    style={{
                      transformOrigin: "50% 50%",
                      transform: `rotate(${rotation}deg)`,
                    }}
                    className="transition-all duration-1000 ease-out"
                  />
                )
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">{total}</div>
                <div className="text-xs text-gray-600">المجموع</div>
              </div>
            </div>
          </div>
          <div className="flex-1 space-y-3">
            {data.labels.map((label, index) => (
              <div key={label} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: data.colors[index % data.colors.length] }}
                  />
                  <span className="font-medium text-gray-700">{label}</span>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-900">{data.data[index]}</div>
                  <div className="text-xs text-gray-600">{((data.data[index] / total) * 100).toFixed(1)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
