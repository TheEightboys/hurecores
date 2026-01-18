import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { policyDocumentsService, storageService, staffService } from '../../lib/services';
import type { PolicyDocument, DocumentAcknowledgement, Profile } from '../../types';
import { JOB_TITLES } from '../../types';

const DocumentsPoliciesManager: React.FC = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [documents, setDocuments] = useState<PolicyDocument[]>([]);
    const [staff, setStaff] = useState<Profile[]>([]);
    const [acknowledgements, setAcknowledgements] = useState<Record<string, DocumentAcknowledgement[]>>({});
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Upload form state
    const [uploadForm, setUploadForm] = useState({
        name: '',
        description: '',
        file: null as File | null,
        assignedTo: 'all' as 'all' | 'roles' | 'individuals',
        assignedRoles: [] as string[],
        assignedStaffIds: [] as string[],
        requiresAcknowledgement: true
    });

    useEffect(() => {
        if (user?.organizationId) {
            loadData();
        }
    }, [user?.organizationId]);

    const loadData = async () => {
        if (!user?.organizationId) return;
        setLoading(true);
        try {
            const [docs, staffList] = await Promise.all([
                policyDocumentsService.getAll(user.organizationId),
                staffService.getAll(user.organizationId)
            ]);
            setDocuments(docs);
            setStaff(staffList);

            // Load acknowledgements for each document
            const ackMap: Record<string, DocumentAcknowledgement[]> = {};
            for (const doc of docs) {
                ackMap[doc.id] = await policyDocumentsService.getAcknowledgements(user.organizationId, doc.id);
            }
            setAcknowledgements(ackMap);
        } catch (error) {
            console.error('Error loading documents:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async () => {
        if (!user?.organizationId || !uploadForm.file) return;

        setUploading(true);
        try {
            // Upload file to storage
            const uploadResult = await storageService.uploadFile(
                uploadForm.file,
                `organizations/${user.organizationId}/policies/${Date.now()}_${uploadForm.file.name}`
            );

            if (!uploadResult.success || !uploadResult.url) {
                throw new Error(uploadResult.error || 'Failed to upload file');
            }

            // Create document record
            await policyDocumentsService.create(user.organizationId, {
                name: uploadForm.name,
                description: uploadForm.description,
                fileUrl: uploadResult.url,
                fileSizeBytes: uploadForm.file.size,
                mimeType: uploadForm.file.type,
                assignedTo: uploadForm.assignedTo,
                assignedRoles: uploadForm.assignedRoles,
                assignedStaffIds: uploadForm.assignedStaffIds,
                requiresAcknowledgement: uploadForm.requiresAcknowledgement
            });

            // Reset form and reload
            setUploadForm({
                name: '',
                description: '',
                file: null,
                assignedTo: 'all',
                assignedRoles: [],
                assignedStaffIds: [],
                requiresAcknowledgement: true
            });
            setShowUploadModal(false);
            loadData();
        } catch (error) {
            console.error('Error uploading document:', error);
            alert('Failed to upload document');
        } finally {
            setUploading(false);
        }
    };

    const getAcknowledgementStatus = (doc: PolicyDocument) => {
        const acks = acknowledgements[doc.id] || [];
        let totalRequired = 0;

        if (doc.assignedTo === 'all') {
            totalRequired = staff.length;
        } else if (doc.assignedTo === 'roles') {
            totalRequired = staff.filter(s => doc.assignedRoles?.includes(s.jobTitle || '')).length;
        } else {
            totalRequired = doc.assignedStaffIds?.length || 0;
        }

        return { acknowledged: acks.length, total: totalRequired };
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin w-8 h-8 border-4 border-teal-600 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Documents & Policies</h2>
                    <p className="text-slate-500">Upload and manage HR documents, policies, SOPs, and handbooks. Assign to staff and track acknowledgements.</p>
                </div>
                <button
                    onClick={() => setShowUploadModal(true)}
                    className="px-6 py-2.5 text-white font-semibold rounded-xl transition-colors hover:opacity-90"
                    style={{ backgroundColor: '#1a2e35' }}
                >
                    + Upload Document
                </button>
            </div>

            {/* Documents List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-4">Document</th>
                            <th className="px-6 py-4">Assigned To</th>
                            <th className="px-6 py-4">Acknowledgements</th>
                            <th className="px-6 py-4">Uploaded</th>
                            <th className="px-6 py-4">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {documents.length > 0 ? documents.map((doc) => {
                            const status = getAcknowledgementStatus(doc);
                            const allAcked = status.acknowledged >= status.total && status.total > 0;

                            return (
                                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div>
                                            <div className="font-bold text-slate-900">{doc.name}</div>
                                            {doc.description && (
                                                <div className="text-sm text-slate-500">{doc.description}</div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase ${doc.assignedTo === 'all'
                                            ? 'bg-blue-100 text-blue-700'
                                            : doc.assignedTo === 'roles'
                                                ? 'bg-purple-100 text-purple-700'
                                                : 'bg-amber-100 text-amber-700'
                                            }`}>
                                            {doc.assignedTo === 'all' ? 'All Staff' :
                                                doc.assignedTo === 'roles' ? `${doc.assignedRoles?.length || 0} Roles` :
                                                    `${doc.assignedStaffIds?.length || 0} Staff`}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        {doc.requiresAcknowledgement ? (
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${allAcked ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                                                <span className={`font-bold ${allAcked ? 'text-green-600' : 'text-amber-600'}`}>
                                                    {status.acknowledged}/{status.total}
                                                </span>
                                                <span className="text-xs text-slate-400">
                                                    {allAcked ? 'Complete' : 'Pending'}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400">Not required</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        {new Date(doc.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <a
                                                href={doc.fileUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="px-3 py-1.5 text-xs font-bold text-teal-600 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
                                            >
                                                View
                                            </a>
                                            <button
                                                onClick={() => alert('View acknowledgement details coming soon!')}
                                                className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                                            >
                                                Details
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={5} className="p-12 text-center">
                                    <div className="text-4xl mb-3 opacity-30">📄</div>
                                    <div className="text-slate-900 font-bold">No documents yet</div>
                                    <div className="text-slate-500 text-sm">Upload your first document to get started.</div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Upload Document</h3>
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Document Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Document Name *</label>
                                <input
                                    type="text"
                                    value={uploadForm.name}
                                    onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                                    placeholder="e.g., Employee Handbook 2024"
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea
                                    value={uploadForm.description}
                                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                                    placeholder="Brief description of this document..."
                                    rows={2}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                                />
                            </div>

                            {/* File Upload */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">File *</label>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx,.txt"
                                    onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                                />
                                {uploadForm.file && (
                                    <p className="text-xs text-slate-500 mt-1">
                                        {uploadForm.file.name} ({(uploadForm.file.size / 1024).toFixed(1)} KB)
                                    </p>
                                )}
                            </div>

                            {/* Assign To */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Assign To</label>
                                <select
                                    value={uploadForm.assignedTo}
                                    onChange={(e) => setUploadForm({ ...uploadForm, assignedTo: e.target.value as any })}
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                                >
                                    <option value="all">All Staff</option>
                                    <option value="roles">Specific Roles</option>
                                    <option value="individuals">Specific Individuals</option>
                                </select>
                            </div>

                            {/* Role Selection */}
                            {uploadForm.assignedTo === 'roles' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Roles</label>
                                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-slate-200 rounded-xl p-3">
                                        {JOB_TITLES.map((role) => (
                                            <label key={role} className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={uploadForm.assignedRoles.includes(role)}
                                                    onChange={(e) => {
                                                        const roles = e.target.checked
                                                            ? [...uploadForm.assignedRoles, role]
                                                            : uploadForm.assignedRoles.filter(r => r !== role);
                                                        setUploadForm({ ...uploadForm, assignedRoles: roles });
                                                    }}
                                                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                                />
                                                <span>{role}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Staff Selection */}
                            {uploadForm.assignedTo === 'individuals' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Staff</label>
                                    <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl p-3 space-y-2">
                                        {staff.map((s) => (
                                            <label key={s.id} className="flex items-center gap-2 text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={uploadForm.assignedStaffIds.includes(s.id)}
                                                    onChange={(e) => {
                                                        const ids = e.target.checked
                                                            ? [...uploadForm.assignedStaffIds, s.id]
                                                            : uploadForm.assignedStaffIds.filter(id => id !== s.id);
                                                        setUploadForm({ ...uploadForm, assignedStaffIds: ids });
                                                    }}
                                                    className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                                                />
                                                <span>{s.fullName || s.email}</span>
                                                <span className="text-xs text-slate-400">{s.jobTitle}</span>
                                            </label>
                                        ))}
                                        {staff.length === 0 && (
                                            <p className="text-sm text-slate-400">No staff members found</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Requires Acknowledgement */}
                            <div className="flex items-center justify-between py-3 border-t border-slate-100">
                                <label className="text-sm font-medium text-slate-700">Requires acknowledgement</label>
                                <button
                                    type="button"
                                    onClick={() => setUploadForm({ ...uploadForm, requiresAcknowledgement: !uploadForm.requiresAcknowledgement })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${uploadForm.requiresAcknowledgement ? 'bg-teal-500' : 'bg-slate-200'
                                        }`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${uploadForm.requiresAcknowledgement ? 'translate-x-6' : 'translate-x-1'
                                        }`} />
                                </button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowUploadModal(false)}
                                className="flex-1 py-2.5 px-4 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleUpload}
                                disabled={uploading || !uploadForm.name || !uploadForm.file}
                                className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-white disabled:opacity-50 transition-colors"
                                style={{ backgroundColor: '#1a2e35' }}
                            >
                                {uploading ? 'Uploading...' : 'Upload'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentsPoliciesManager;
