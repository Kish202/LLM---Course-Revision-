import { useState, useEffect } from 'react';
import { pdfAPI } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Trash2, CheckCircle2 } from 'lucide-react';

const Dashboard = () => {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPDFs();
  }, []);

  const fetchPDFs = async () => {
    try {
      const response = await pdfAPI.getAll();
      setPdfs(response.data.pdfs);
    } catch (err) {
      setError('Failed to fetch PDFs');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace('.pdf', ''));
      }
      setError('');
    } else {
      setError('Please select a valid PDF file');
      setSelectedFile(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);
      formData.append('title', title || selectedFile.name);

      await pdfAPI.upload(formData);
      setSuccess('PDF uploaded successfully! Processing in background...');
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setTitle('');
      fetchPDFs();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this PDF?')) {
      return;
    }

    try {
      await pdfAPI.delete(id);
      setSuccess('PDF deleted successfully');
      fetchPDFs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Delete failed');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Your Coursebooks</h1>
          <p className="text-gray-600 mt-1">Manage your coursebooks and start learning</p>
        </div>

        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="blue_btn" className="cursor-pointer">
              <Upload className="h-4 w-4" />
              Upload PDF
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Coursebook</DialogTitle>
              <DialogDescription>
                Upload a PDF of your coursebook to generate quizzes and chat
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Physics Class XI"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">PDF File</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                />
              </div>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <Button
                onClick={handleUpload}
                disabled={uploading || !selectedFile}
                className="w-full cursor-pointer"
                variant="blue_btn"
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Success Message */}
      {success && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {/* PDFs Grid */}
      <div>
        {pdfs.length === 0 ? (
          <div className='text-center py-20 border border-dashed rounded-lg'>
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No PDFs uploaded yet</p>
            <p className="text-sm text-gray-500 mt-2">Upload your first coursebook to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium">Title</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Pages</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Uploaded</th>
                  <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
                  <th className="px-4 py-2 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pdfs.map((pdf) => (
                  <tr key={pdf._id} className="hover:bg-gray-50 transition-colors">
                    {/* Title */}
                    <td className="px-4 py-2">
                      <span className="font-medium text-gray-900">{pdf.title}</span>
                    </td>

                    {/* Pages */}
                    <td className="px-4 py-2 text-gray-600">
                      {pdf.totalPages ? `${pdf.totalPages} pages` : 'Processing...'}
                    </td>

                    {/* Uploaded date */}
                    <td className="px-4 py-2 text-sm text-gray-500">
                      {new Date(pdf.uploadedAt).toLocaleDateString()}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-2">
                      {pdf.isSeeded ? (
                        <Badge variant="secondary">Seeded</Badge>
                      ) : (
                        <span className="text-gray-500 text-sm">User Upload</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-2 text-right">
                      {!pdf.isSeeded && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(pdf._id)}
                          className="cursor-pointer hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        )}
      </div>
    </div>
  );
};

export default Dashboard;