
import { AlertTriangle, X } from "lucide-react"

interface AdminWarningToastProps {
    message: string | null;
    onClose: () => void;
}

export function AdminWarningToast({ message, onClose }: AdminWarningToastProps) {
    if (!message) return null;

    return (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-5 fade-in duration-300">
            <div className="bg-destructive/10 border border-destructive text-destructive px-6 py-4 rounded-lg shadow-lg flex items-center gap-4 max-w-md backdrop-blur-md">
                <div className="bg-destructive text-white p-2 rounded-full">
                    <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                    <h4 className="font-bold text-lg">Proctor Warning</h4>
                    <p className="text-sm font-medium">{message}</p>
                </div>
                <button
                    onClick={onClose}
                    className="ml-auto hover:bg-destructive/20 p-1 rounded transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>
            </div>
        </div>
    )
}
