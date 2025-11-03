"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

export interface Toast {
  id: string;
  title?: string;
  message: string;
  type?: "success" | "error" | "warning" | "info";
  duration?: number;
}

interface ToasterProps {
  toasts?: Toast[];
}

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const toastColors = {
  success: "bg-green-500 text-white",
  error: "bg-red-500 text-white",
  warning: "bg-yellow-500 text-white",
  info: "bg-blue-500 text-white",
};

let toastId = 0;

class ToastManager {
  private listeners: ((toasts: Toast[]) => void)[] = [];
  private toasts: Toast[] = [];

  subscribe(listener: (toasts: Toast[]) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.toasts));
  }

  add(toast: Omit<Toast, "id">) {
    const id = (++toastId).toString();
    const newToast: Toast = {
      id,
      type: "info",
      duration: 5000,
      ...toast,
    };

    this.toasts.push(newToast);
    this.notify();

    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        this.remove(id);
      }, newToast.duration);
    }

    return id;
  }

  remove(id: string) {
    this.toasts = this.toasts.filter((toast) => toast.id !== id);
    this.notify();
  }

  clear() {
    this.toasts = [];
    this.notify();
  }
}

export const toastManager = new ToastManager();

// Helper functions for easier usage
export const toast = {
  success: (message: string, title?: string) =>
    toastManager.add({ message, title, type: "success" }),
  error: (message: string, title?: string) =>
    toastManager.add({ message, title, type: "error" }),
  warning: (message: string, title?: string) =>
    toastManager.add({ message, title, type: "warning" }),
  info: (message: string, title?: string) =>
    toastManager.add({ message, title, type: "info" }),
};

function ToastItem({
  toast: toastItem,
  onRemove,
}: {
  toast: Toast;
  onRemove: (id: string) => void;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const Icon = toastIcons[toastItem.type || "info"];

  useEffect(() => {
    // Trigger animation
    setTimeout(() => setIsVisible(true), 50);
  }, []);

  const handleRemove = () => {
    setIsVisible(false);
    setTimeout(() => onRemove(toastItem.id), 300);
  };

  return (
    <div
      className={`transform transition-all duration-300 ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      } max-w-sm rounded-lg shadow-lg p-4 ${
        toastColors[toastItem.type || "info"]
      }`}
    >
      <div className="flex items-start space-x-3">
        <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          {toastItem.title && (
            <p className="font-medium text-sm">{toastItem.title}</p>
          )}
          <p className={`text-sm ${toastItem.title ? "mt-1" : ""}`}>
            {toastItem.message}
          </p>
        </div>
        <button
          onClick={handleRemove}
          className="flex-shrink-0 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function Toaster({ toasts: propToasts }: ToasterProps) {
  const [toasts, setToasts] = useState<Toast[]>(propToasts || []);

  useEffect(() => {
    return toastManager.subscribe(setToasts);
  }, []);

  const handleRemove = (id: string) => {
    toastManager.remove(id);
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={handleRemove} />
      ))}
    </div>
  );
}
