import { FileTextIcon, PlusIcon, SparklesIcon, TimerIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const stats = [
  {
    title: "Total Resumes",
    value: "12",
    description: "3 created this month",
    icon: FileTextIcon,
  },
  {
    title: "Last Edited",
    value: "2 hours ago",
    description: "Marketing Resume 2024",
    icon: TimerIcon,
  },
  {
    title: "Templates Used",
    value: "5",
    description: "Across all resumes",
    icon: SparklesIcon,
  },
]

const quickActions = [
  {
    title: "Create New Resume",
    description: "Start from scratch or use a template",
    icon: PlusIcon,
    variant: "default" as const,
  },
  {
    title: "Browse Templates",
    description: "Explore professional designs",
    icon: SparklesIcon,
    variant: "outline" as const,
  },
]

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your resumes.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="size-4 text-muted-foreground" data-icon="inline-end" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold">Quick Actions</h2>
        <p className="text-sm text-muted-foreground">
          Get started with common tasks
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action) => (
          <Card key={action.title} className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardHeader className="flex flex-row items-center gap-3 pb-2">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <action.icon className="size-5 text-primary" data-icon="inline-start" />
              </div>
              <div>
                <CardTitle className="text-base">{action.title}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription>{action.description}</CardDescription>
            </CardContent>
            <CardFooter>
              <Button variant={action.variant} size="sm" className="w-full">
                {action.title.replace("Resume", "").replace("Templates", "Templates").trim() || "Get Started"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
