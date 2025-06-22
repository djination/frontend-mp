import { useState, useEffect } from 'react';
import axiosInstance from '../../../config/axiosInstance';
import { 
  Form, Upload, Button, Select, DatePicker, Space, Table, 
  message, Popconfirm, Tooltip, Spin, Card, Modal, Image
} from 'antd';
import { 
  UploadOutlined, DeleteOutlined, FileImageOutlined, 
  FilePdfOutlined, FileOutlined 
} from '@ant-design/icons';
import dayjs from 'dayjs'; // Ganti moment dengan dayjs
import PropTypes from 'prop-types';
import { getDocumentTypes } from '../../../api/documentTypeApi';

const AccountDocumentForm = ({
    accountDocuments = [],
    onChange,
    accountId,
    isEdit
}) => {
    const [documents, setDocuments] = useState([]);
    const [documentTypes, setDocumentTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadForm] = Form.useForm();
    const [document_type, setDocumentType] = useState(null);
    const [expires_at, setExpiresAt] = useState(null);
    const [file, setFile] = useState(null);

    const [previewVisible, setPreviewVisible] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [previewTitle, setPreviewTitle] = useState('');
    const [previewType, setPreviewType] = useState(null);
    
    // Perbaiki fungsi handlePreview
    const handlePreview = (record) => {
        const apiUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';
        
        if (record.url) {
            // File lokal (baru diupload)
            setPreviewUrl(record.url);
            setPreviewTitle(record.filename);
            setPreviewType(record.fileType || record.mime_type);
            setPreviewVisible(true);
        } else if (record.id) {
            // Menggunakan axiosInstance yang sudah terautentikasi
            const downloadUrl = `/account-document/${record.id}/download?inline=true`;
            
            // Set loading state jika dibutuhkan
            setLoading(true);
            
            // Buat blob URL dari response untuk menangani autentikasi
            axiosInstance.get(downloadUrl, { responseType: 'blob' })
                .then(response => {
                    const fileBlob = new Blob([response.data], { type: response.data.type });
                    const fileUrl = URL.createObjectURL(fileBlob);
                    
                    setPreviewUrl(fileUrl);
                    setPreviewTitle(record.filename);
                    setPreviewType(record.fileType || record.mime_type || response.data.type);
                    setPreviewVisible(true);
                })
                .catch(error => {
                    console.error("Failed to fetch document:", error);
                    message.error("Failed to load document. Please try again.");
                    
                    // Fallback ke URL langsung jika ada
                    if (record.file_path) {
                        const fallbackUrl = `${apiUrl}/${record.file_path.startsWith('/') ? record.file_path.slice(1) : record.file_path}`;
                        setPreviewUrl(fallbackUrl);
                        setPreviewTitle(record.filename);
                        setPreviewType(record.fileType || record.mime_type);
                        setPreviewVisible(true);
                    }
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    };

    // Tambahkan fungsi closePreview
    const closePreview = () => {
        // Clean up blob URL to prevent memory leaks
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setPreviewVisible(false);
    };

    // Load initial data
    useEffect(() => {
        fetchDocumentTypes();
        if (Array.isArray(accountDocuments)) {
            // Proses dokumen untuk memastikan semua field yang dibutuhkan tersedia
            const processedDocs = accountDocuments.map(doc => ({
                ...doc,
                // Tambahkan field yang mungkin hilang
                document_type_name: doc.document_type_name || 
                    documentTypes.find(t => t.code === doc.document_type)?.name || 
                    doc.document_type
            }));
            
            setDocuments(processedDocs);
        } else {
            setDocuments([]);
        }
    }, [accountDocuments]);

    // Fetch document types from API (dynamic)
    const fetchDocumentTypes = async () => {
        try {
            setLoading(true);
            const response = await getDocumentTypes();
            if (response?.data) {
            // Pastikan kita mengambil array yang benar
            let types = [];
            
            // Handle berbagai kemungkinan format respons
            if (Array.isArray(response.data)) {
                types = response.data;
            } else if (Array.isArray(response.data.data)) {
                types = response.data.data;
            } else if (typeof response.data === 'object') {
                types = Object.values(response.data);
            }
            
            setDocumentTypes(types);
            } else {
            setDocumentTypes([]);
            }
        } catch (error) {
            message.error('Failed to fetch document types');
            
            // Tambahkan fallback data jika API gagal
            setDocumentTypes([
            { code: 'KTP', name: 'KTP' },
            { code: 'NPWP', name: 'NPWP' },
            { code: 'SIM', name: 'SIM' },
            { code: 'PASPOR', name: 'Paspor' }
            ]);
        } finally {
            setLoading(false);
        }
    };

    const getFileIcon = (fileType) => {
        if (!fileType) return <FileOutlined />;
        if (fileType.includes('image')) return <FileImageOutlined />;
        if (fileType.includes('pdf')) return <FilePdfOutlined />;
        return <FileOutlined />;
    };

    const handleUpload = () => {
        if (!document_type) {
            message.error('Please select document type');
            return;
        }

        if (!file) {
            message.error('Please select a file to upload');
            return;
        }

        // Get document type name for display
        const documentTypeName = documentTypes.find(
            type => type.name === document_type
        )?.name || document_type;
        
        // Buat URL untuk preview lokal dengan variabel yang dideklarasikan
        const objectUrl = URL.createObjectURL(file.originFileObj);

        // Create a new document entry
        const newDocument = {
            tempId: `temp-${Date.now()}`,
            account_id: accountId,
            document_type,
            document_type_name: documentTypeName,
            expires_at: expires_at ? dayjs(expires_at).format('YYYY-MM-DD') : null,
            file: file.originFileObj,
            filename: file.name,
            fileType: file.type,
            file_size: file.size,
            url: objectUrl,
            uploaded: false,
            // Info debug
            _debug_info: {
                hasFile: !!file.originFileObj,
                fileSize: file.size,
                fileType: file.type
            }
        };
        const updatedDocuments = [...documents, newDocument];
        setDocuments(updatedDocuments);
        onChange(updatedDocuments);
        
        // Reset form fields
        setDocumentType(null);
        setExpiresAt(null);
        setFile(null);
        
        message.success('Document added successfully');
    };

    const handleDelete = (documentId) => {
        const updatedDocuments = documents.filter(doc => 
        doc.id !== documentId && doc.tempId !== documentId
        );
        setDocuments(updatedDocuments);
        onChange(updatedDocuments);
    };

    // Fungsi untuk render preview berdasarkan tipe file
    const renderPreviewContent = () => {
        if (!previewUrl) return <div>No preview available</div>;
        // Untuk gambar
        if (previewType && previewType.includes('image')) {
            return (
                <div style={{ textAlign: 'center' }}>
                    <Image 
                        src={previewUrl} 
                        style={{ maxWidth: '100%' }}
                        preview={{ maskClassName: 'custom-mask' }}
                        fallback="data:image/png;base64,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"
                        onError={(e) => {
                            console.error("Image failed to load:", e);
                            message.error("Failed to load image");
                        }}
                    />
                </div>
            );
        }

        // Untuk PDF - Menggunakan object tag yang lebih baik daripada iframe
        if (previewType && previewType.includes('pdf')) {
            return (
                <div style={{ height: '70vh', width: '100%' }}>
                    <object
                        data={previewUrl}
                        type="application/pdf"
                        width="100%"
                        height="100%"
                    >
                        <p>PDF tidak dapat ditampilkan. 
                            <Button type="link" onClick={() => window.open(previewUrl, '_blank')}>
                                Klik di sini untuk membuka PDF di tab baru
                            </Button>
                        </p>
                    </object>
                </div>
            );
        }

        // Untuk tipe file lainnya
        return (
            <div style={{ textAlign: 'center', padding: '20px' }}>
                <p>Preview not available for this file type ({previewType || 'unknown'}).</p>
                <Button type="primary" onClick={() => window.open(previewUrl, '_blank')}>
                    Open File in New Tab
                </Button>
            </div>
        );
    };

    const columns = [
        {
            title: 'Document',
            dataIndex: 'filename',
            key: 'filename',
            render: (text, record) => (
                <Space>
                    {getFileIcon(record.fileType || record.mime_type)}
                    <a onClick={() => handlePreview(record)} style={{ cursor: 'pointer' }}>
                        <Tooltip title={text}>
                            <span>{text && text.length > 20 ? `${text.substring(0, 20)}...` : text}</span>
                        </Tooltip>
                    </a>
                </Space>
            )
        },
        {
            title: 'Type',
            dataIndex: 'document_type_name',
            key: 'document_type',
            render: (text, record) => {
                return text || documentTypes.find(t => t.code === record.document_type)?.name || record.document_type;
            }
        },
        {
            title: 'Expires At',
            dataIndex: 'expires_at',
            key: 'expires_at',
            render: (date) => date ? dayjs(date).format('DD-MM-YYYY') : 'No expiration'
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space>
                    <Popconfirm
                        title="Are you sure you want to delete this document?"
                        onConfirm={() => handleDelete(record.id || record.tempId)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                        />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    if (loading && documentTypes.length === 0) {
        return <Card><Spin /></Card>; // Perbaikan untuk warning Spin tip
    }

    return (
        <div>
            {/* Ganti Form dengan div untuk mencegah nested form */}
            <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <div style={{ minWidth: '200px' }}>
                    <div className="ant-form-item-label">
                    <label className="ant-form-item-required">Document Type</label>
                    </div>
                    <Select 
                        placeholder="Select document type"
                        style={{ width: '100%' }}
                        value={document_type}
                        onChange={(value) => setDocumentType(value)}
                        options={documentTypes.map(type => ({
                            value: type.code || type.id || String(Math.random()),
                            label: type.name || type.code || 'Unknown Document Type'
                        }))}
                        loading={loading}
                        notFoundContent={loading ? <Spin size="small" /> : "No document types found"}
                    />
                </div>
                
                <div style={{ minWidth: '200px' }}>
                    <div className="ant-form-item-label">
                    <label>Expires At</label>
                    </div>
                    <DatePicker 
                    placeholder="Select expiration date" 
                    format="DD-MM-YYYY"
                    value={expires_at ? dayjs(expires_at) : null}
                    onChange={(date) => setExpiresAt(date)}
                    disabledDate={current => current && current < dayjs().startOf('day')}
                    style={{ width: '100%' }}
                    />
                </div>
                
                <div style={{ minWidth: '300px' }}>
                    <div className="ant-form-item-label">
                    <label className="ant-form-item-required">Upload Document</label>
                    </div>
                    <Upload 
                    beforeUpload={() => false} 
                    maxCount={1}
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    listType="picture"
                    fileList={file ? [file] : []}
                    onChange={(info) => {
                        if (info.fileList.length > 0) {
                        setFile(info.fileList[0]);
                        } else {
                        setFile(null);
                        }
                    }}
                    >
                    <Button icon={<UploadOutlined />}>Select File</Button>
                    </Upload>
                </div>
                
                <div style={{ marginTop: '29px' }}>
                    <Button 
                    type="primary" 
                    onClick={handleUpload}
                    disabled={!document_type || !file}
                    >
                    Add Document
                    </Button>
                </div>
            </div>
        </div>

        <Table
            columns={columns}
            dataSource={documents}
            rowKey={record => record.id || record.tempId || `doc-${Math.random()}`}
            pagination={false}
        />

            {/* Modal Preview Dokumen */}
            <Modal
                open={previewVisible}
                title={previewTitle || "Document Preview"}
                onCancel={closePreview}
                footer={[
                    <Button key="close" onClick={closePreview}>
                        Close
                    </Button>,
                    previewUrl && (
                        <Button 
                            key="download" 
                            type="primary" 
                            onClick={() => window.open(previewUrl, '_blank')}
                        >
                            Open in New Tab
                        </Button>
                    )
                ]}
                width="80%"
                styles={{ 
                    body: {
                        maxHeight: '70vh', 
                        overflow: 'auto', 
                        padding: previewType && previewType.includes('image') ? '0' : '24px',
                        textAlign: 'center'
                    }
                }}
            >
                {loading ? (
                    <div style={{ padding: '40px 0' }}>
                        <Spin tip="Loading document..." />
                    </div>
                ) : (
                    renderPreviewContent()
                )}
            </Modal>
        </div>
    );
};

AccountDocumentForm.propTypes = {
    accountDocuments: PropTypes.array,
    onChange: PropTypes.func.isRequired,
    accountId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    isEdit: PropTypes.bool.isRequired,
};

export default AccountDocumentForm;