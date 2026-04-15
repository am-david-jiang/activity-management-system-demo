"use client";

import { useState } from "react";
import type { ConceptOption } from "@/lib/services/poster-gen.websocket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

interface ConceptEditorProps {
  direction: ConceptOption;
  onSave: (direction: ConceptOption) => void;
  onCancel: () => void;
}

export function ConceptEditor({ direction, onSave, onCancel }: ConceptEditorProps) {
  const [edited, setEdited] = useState<ConceptOption>({ ...direction });

  const handleSave = () => {
    onSave(edited);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>编辑方向 {edited.direction_id}</CardTitle>
            <CardDescription>修改海报设计方向细节</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Style */}
        <div className="space-y-2">
          <Label htmlFor="style">风格</Label>
          <Input
            id="style"
            value={edited.style}
            onChange={(e) => setEdited({ ...edited, style: e.target.value })}
            placeholder="例如: 现代简约、复古、国潮"
          />
        </div>

        {/* Color Palette */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="primary">主色</Label>
            <div className="flex gap-2">
              <Input
                id="primary"
                type="color"
                value={edited.color_palette.primary}
                onChange={(e) =>
                  setEdited({
                    ...edited,
                    color_palette: { ...edited.color_palette, primary: e.target.value },
                  })
                }
                className="w-12 h-10 p-1"
              />
              <Input
                value={edited.color_palette.primary}
                onChange={(e) =>
                  setEdited({
                    ...edited,
                    color_palette: { ...edited.color_palette, primary: e.target.value },
                  })
                }
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="secondary">辅助色</Label>
            <div className="flex gap-2">
              <Input
                id="secondary"
                type="color"
                value={edited.color_palette.secondary}
                onChange={(e) =>
                  setEdited({
                    ...edited,
                    color_palette: { ...edited.color_palette, secondary: e.target.value },
                  })
                }
                className="w-12 h-10 p-1"
              />
              <Input
                value={edited.color_palette.secondary}
                onChange={(e) =>
                  setEdited({
                    ...edited,
                    color_palette: { ...edited.color_palette, secondary: e.target.value },
                  })
                }
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="accent">点缀色</Label>
            <div className="flex gap-2">
              <Input
                id="accent"
                type="color"
                value={edited.color_palette.accent}
                onChange={(e) =>
                  setEdited({
                    ...edited,
                    color_palette: { ...edited.color_palette, accent: e.target.value },
                  })
                }
                className="w-12 h-10 p-1"
              />
              <Input
                value={edited.color_palette.accent}
                onChange={(e) =>
                  setEdited({
                    ...edited,
                    color_palette: { ...edited.color_palette, accent: e.target.value },
                  })
                }
                className="flex-1"
              />
            </div>
          </div>
        </div>

        {/* Visual Elements */}
        <div className="space-y-2">
          <Label htmlFor="visual_elements">视觉元素 (逗号分隔)</Label>
          <Input
            id="visual_elements"
            value={edited.visual_elements.join(", ")}
            onChange={(e) =>
              setEdited({
                ...edited,
                visual_elements: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
              })
            }
            placeholder="例如: 灯笼、祥云、梅花"
          />
        </div>

        {/* Layout Hints */}
        <div className="space-y-2">
          <Label htmlFor="layout_hints">布局建议</Label>
          <Textarea
            id="layout_hints"
            value={edited.layout_hints}
            onChange={(e) => setEdited({ ...edited, layout_hints: e.target.value })}
            placeholder="描述布局要求..."
          />
        </div>

        {/* Title Concept */}
        <div className="space-y-2">
          <Label htmlFor="title_concept">标题文案方向</Label>
          <Input
            id="title_concept"
            value={edited.title_concept}
            onChange={(e) => setEdited({ ...edited, title_concept: e.target.value })}
            placeholder="标题文案方向"
          />
        </div>

        {/* Image Prompt */}
        <div className="space-y-2">
          <Label htmlFor="image_prompt">图像生成 Prompt (英文)</Label>
          <Textarea
            id="image_prompt"
            value={edited.image_prompt}
            onChange={(e) => setEdited({ ...edited, image_prompt: e.target.value })}
            placeholder="A Chinese traditional poster with red and gold colors, featuring..."
            className="min-h-[100px]"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button onClick={handleSave}>保存并使用此方向</Button>
        </div>
      </CardContent>
    </Card>
  );
}
