import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Department {
  id: string;
  name: string;
  prefix: string;
  max_tokens_per_day: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  icon_name: string;
  color_code: string;
  created_at: string;
  updated_at: string;
}

interface DepartmentFormProps {
  department?: Department | null;
  onClose: () => void;
  onSuccess: (department: Department, isEdit: boolean) => void;
}

interface FormData {
  name: string;
  prefix: string;
  max_tokens_per_day: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  icon_name: string;
  color_code: string;
}

const defaultColors = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
  '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',
  '#6366f1', '#ec4899', '#14b8a6', '#eab308'
];

const commonIcons = [
  'stethoscope', 'test-tube', 'pill', 'x-ray', 'scan-line', 
  'receipt', 'heart', 'brain', 'eye', 'activity'
];

export const DepartmentForm: React.FC<DepartmentFormProps> = ({ 
  department, 
  onClose, 
  onSuccess 
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    prefix: '',
    max_tokens_per_day: 100,
    start_time: '08:00',
    end_time: '17:00',
    is_active: true,
    icon_name: 'activity',
    color_code: '#3b82f6'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const { toast } = useToast();
  const isEdit = !!department;

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name,
        prefix: department.prefix,
        max_tokens_per_day: department.max_tokens_per_day,
        start_time: department.start_time,
        end_time: department.end_time,
        is_active: department.is_active,
        icon_name: department.icon_name,
        color_code: department.color_code
      });
    }
  }, [department]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Department name is required';
    }

    if (!formData.prefix.trim()) {
      newErrors.prefix = 'Department prefix is required';
    } else if (formData.prefix.length > 3) {
      newErrors.prefix = 'Prefix must be 3 characters or less';
    }

    if (formData.max_tokens_per_day < 1) {
      newErrors.max_tokens_per_day = 'Daily token limit must be at least 1';
    }

    if (formData.start_time >= formData.end_time) {
      newErrors.start_time = 'Start time must be before end time';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isEdit && department) {
        const { data, error } = await supabase
          .from('departments')
          .update(formData)
          .eq('id', department.id)
          .select()
          .single();

        if (error) throw error;
        onSuccess(data, true);
      } else {
        const { data, error } = await supabase
          .from('departments')
          .insert([formData])
          .select()
          .single();

        if (error) throw error;
        onSuccess(data, false);
      }
    } catch (error: any) {
      console.error('Error saving department:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save department. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Department' : 'Add New Department'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Department Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Department Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="e.g., Cardiology"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Department Prefix */}
          <div className="space-y-2">
            <Label htmlFor="prefix">Department Prefix *</Label>
            <Input
              id="prefix"
              value={formData.prefix}
              onChange={(e) => handleInputChange('prefix', e.target.value.toUpperCase())}
              placeholder="e.g., CAR"
              maxLength={3}
              className={errors.prefix ? 'border-destructive' : ''}
            />
            {errors.prefix && (
              <p className="text-sm text-destructive">{errors.prefix}</p>
            )}
            <p className="text-xs text-muted-foreground">Used for token generation (max 3 characters)</p>
          </div>

          {/* Operating Hours */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="time"
                value={formData.start_time}
                onChange={(e) => handleInputChange('start_time', e.target.value)}
                className={errors.start_time ? 'border-destructive' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="time"
                value={formData.end_time}
                onChange={(e) => handleInputChange('end_time', e.target.value)}
              />
            </div>
          </div>
          {errors.start_time && (
            <p className="text-sm text-destructive">{errors.start_time}</p>
          )}

          {/* Daily Token Limit */}
          <div className="space-y-2">
            <Label htmlFor="max_tokens">Daily Token Limit</Label>
            <Input
              id="max_tokens"
              type="number"
              min="1"
              value={formData.max_tokens_per_day}
              onChange={(e) => handleInputChange('max_tokens_per_day', Math.max(1, parseInt(e.target.value) || 1))}
              className={errors.max_tokens_per_day ? 'border-destructive' : ''}
            />
            {errors.max_tokens_per_day && (
              <p className="text-sm text-destructive">{errors.max_tokens_per_day}</p>
            )}
          </div>

          {/* Color Selection */}
          <div className="space-y-2">
            <Label>Department Color</Label>
            <div className="grid grid-cols-6 gap-2">
              {defaultColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${
                    formData.color_code === color ? 'border-primary' : 'border-border'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => handleInputChange('color_code', color)}
                />
              ))}
            </div>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="is_active">Department Active</Label>
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => handleInputChange('is_active', checked)}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={loading}
            >
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};