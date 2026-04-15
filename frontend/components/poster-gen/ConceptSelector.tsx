"use client";

import { useState } from "react";
import type { ConceptOption } from "@/lib/services/poster-gen.websocket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Edit3, RefreshCw } from "lucide-react";

interface ConceptSelectorProps {
  directions: ConceptOption[];
  sessionId: string;
  onSelect: (directionId: string) => void;
  onEdit: (direction: ConceptOption) => void;
  onRequestNew: () => void;
  isLoading?: boolean;
}

export function ConceptSelector({
  directions,
  sessionId,
  onSelect,
  onEdit,
  onRequestNew,
  isLoading = false,
}: ConceptSelectorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">选择海报方向</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onRequestNew}
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          生成新方向
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {directions.map((direction) => (
          <Card
            key={direction.direction_id}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedId === direction.direction_id
                ? "ring-2 ring-primary"
                : ""
            }`}
            onClick={() => setSelectedId(direction.direction_id)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline">方向 {direction.direction_id}</Badge>
                {selectedId === direction.direction_id && (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                )}
              </div>
              <CardTitle className="text-base mt-2">{direction.style}</CardTitle>
              <CardDescription>{direction.title_concept}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Color Palette */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">配色:</span>
                <div className="flex gap-1">
                  <div
                    className="w-5 h-5 rounded-full border"
                    style={{ backgroundColor: direction.color_palette.primary }}
                    title={`主色: ${direction.color_palette.primary}`}
                  />
                  <div
                    className="w-5 h-5 rounded-full border"
                    style={{ backgroundColor: direction.color_palette.secondary }}
                    title={`辅助色: ${direction.color_palette.secondary}`}
                  />
                  <div
                    className="w-5 h-5 rounded-full border"
                    style={{ backgroundColor: direction.color_palette.accent }}
                    title={`点缀色: ${direction.color_palette.accent}`}
                  />
                </div>
              </div>

              {/* Visual Elements */}
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">视觉元素:</span>
                <div className="flex flex-wrap gap-1">
                  {direction.visual_elements.slice(0, 3).map((element, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {element}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Layout Hints */}
              <p className="text-xs text-muted-foreground line-clamp-2">
                {direction.layout_hints}
              </p>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(direction.direction_id);
                  }}
                  disabled={isLoading}
                >
                  选择此方向
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(direction);
                  }}
                  disabled={isLoading}
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
