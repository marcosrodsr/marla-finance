"use client";

import Card from "@/components/Card";
import Button from "@/components/Button";

export default function SettingsPage() {
    const handleReset = () => {
        if (confirm("¿Estás seguro de que deseas borrar todos los datos locales? Esto te devolverá al estado inicial de demostración.")) {
            localStorage.clear();
            window.location.reload();
        }
    };

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-500">
            <div className="mb-8">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">Ajustes</h1>
                <p className="mt-1 text-slate-400 font-medium">Configuración de la aplicación</p>
            </div>

            <Card>
                <div className="py-6 border-b border-slate-800">
                    <h3 className="text-lg font-bold text-slate-200 mb-2">Restablecer Datos</h3>
                    <p className="text-sm text-slate-400 mb-6">
                        Si has añadido transacciones o categorías de prueba y quieres volver a ver todo el Dashboard tal y como estaba con los datos iniciales, pulsa el siguiente botón.
                    </p>
                    <Button
                        onClick={handleReset}
                        className="bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white border border-red-500/30"
                    >
                        Borrar Datos y Restaurar
                    </Button>
                </div>

                <div className="text-center py-12 text-slate-600">
                    <p className="text-sm font-medium">Más ajustes próximamente...</p>
                    <p className="text-xs mt-2 text-slate-700">Configuración de usuarios, gestión de límites, etc.</p>
                </div>
            </Card>
        </div>
    );
}
