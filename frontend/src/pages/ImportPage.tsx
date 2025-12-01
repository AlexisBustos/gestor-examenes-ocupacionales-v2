import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileSpreadsheet, Loader2, Download, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [stats, setStats] = useState<{ companies: number; ges: number; risks: number } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStats(null); // Limpiar resultados anteriores
    }
  };

  const handleDownloadTemplate = () => {
    // Generar un CSV simple de ejemplo
    const headers = ['Empresa', 'Centro', 'Area', 'GES', 'Descripcion Tareas', 'Agentes', 'Agente Especifico', 'Tipo Exposicion'];
    const row = ['WEIR', 'Planta 1', 'Prensa', 'Operador', 'Soldadura MIG', 'Ruido, Humos', 'Tolueno', 'Cronica'];

    const csvContent = "data:text/csv;charset=utf-8,"
      + headers.join(",") + "\n"
      + row.join(",");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "plantilla_carga_masiva.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setStats(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/import/structure`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error del servidor: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Datos recibidos:", data);

      toast.success("Archivo procesado correctamente");
      setStats(data.stats);
      setFile(null);

      // Limpiar el input file visualmente (truco rápido)
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error: any) {
      console.error("❌ Error en la petición:", error);
      toast.error("Error al procesar el archivo: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Carga Masiva</h1>
        <p className="text-muted-foreground">Importa la estructura organizacional y riesgos desde Excel.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* TARJETA DE CARGA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Subir Archivo
            </CardTitle>
            <CardDescription>
              Soporta archivos .xlsx y .csv. Asegúrate de usar la plantilla correcta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">

            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg p-10 hover:bg-gray-50 transition-colors">
              <FileSpreadsheet className="h-10 w-10 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 mb-4 text-center">
                {file ? (
                  <span className="font-semibold text-blue-600">{file.name}</span>
                ) : (
                  "Arrastra tu archivo aquí o haz clic para seleccionar"
                )}
              </p>
              <input
                id="file-upload"
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="block w-full text-sm text-slate-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-full file:border-0
                      file:text-sm file:font-semibold
                      file:bg-violet-50 file:text-violet-700
                      hover:file:bg-violet-100
                    "
              />
            </div>

            <div className="flex gap-3">
              <Button
                className="flex-1"
                onClick={handleUpload}
                disabled={!file || isUploading}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Procesando...
                  </>
                ) : (
                  "Procesar Archivo"
                )}
              </Button>

              <Button variant="outline" onClick={handleDownloadTemplate} title="Descargar Plantilla">
                <Download className="h-4 w-4" />
              </Button>
            </div>

          </CardContent>
        </Card>

        {/* TARJETA DE RESULTADOS */}
        <Card className={stats ? "border-green-200 bg-green-50" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {stats ? <CheckCircle className="h-5 w-5 text-green-600" /> : <AlertTriangle className="h-5 w-5 text-gray-400" />}
              Resultado de la Importación
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats ? (
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-white rounded border">
                  <span className="text-sm font-medium">Empresas Creadas/Actualizadas:</span>
                  <span className="text-lg font-bold text-green-700">{stats.companies}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded border">
                  <span className="text-sm font-medium">GES Creados/Actualizados:</span>
                  <span className="text-lg font-bold text-blue-700">{stats.ges}</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-white rounded border">
                  <span className="text-sm font-medium">Riesgos Vinculados:</span>
                  <span className="text-lg font-bold text-purple-700">{stats.risks}</span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Aquí aparecerán los resultados después de procesar el archivo.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}