"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Calendar, CalendarDays } from "lucide-react";
import { DailyView } from "./daily-view";
import { SchedulerEventProvider } from "./scheduler-event-context";
import { AddEventForm } from "./add-event-form";

export interface Event {
  id: number;
  title: string;
  description?: string;
  startDate: Date;
  endDate: Date;
  address: string;
}

interface SchedulerProps {
  events: Event[];
  onEventsChange: (events: Event[]) => void;
  defaultVisibleDate?: Date;
}

export function Scheduler({
  events,
  onEventsChange,
  defaultVisibleDate = new Date(),
}: SchedulerProps) {
  const [activeTab, setActiveTab] = useState("day");
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <SchedulerEventProvider events={events} onEventsChange={onEventsChange}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-fit"
          >
            <TabsList>
              <TabsTrigger value="day">
                <Calendar className="size-4 mr-1" />日
              </TabsTrigger>
              <TabsTrigger value="week">
                <CalendarDays className="size-4 mr-1" />周
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <Button onClick={() => setDialogOpen(true)}>新增日程</Button>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>新增日程</DialogTitle>
                <DialogDescription>创建一个新的日程安排</DialogDescription>
              </DialogHeader>
              <AddEventForm
                isOpen={dialogOpen}
                onSuccess={() => setDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
        {activeTab === "day" && (
          <DailyView defaultVisibleDate={defaultVisibleDate} />
        )}
      </div>
    </SchedulerEventProvider>
  );
}
