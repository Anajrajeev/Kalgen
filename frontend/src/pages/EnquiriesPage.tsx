import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { MessageCircle, ArrowLeft, Clock } from 'lucide-react';
import { useTranslation } from '../services/useTranslation';
import { apiClient } from '../services/api';

interface Enquiry {
    user_id: string;
    name: string;
    last_message: string;
    timestamp: string;
    unread_count: number;
}

export function EnquiriesPage() {
    const navigate = useNavigate();
    const { label } = useTranslation();
    const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEnquiries = async () => {
            setLoading(true);
            const res = await apiClient.getConversations();
            if (res.data) {
                setEnquiries(res.data);
            }
            setLoading(false);
        };
        fetchEnquiries();
    }, []);

    const handleOpenChat = (userId: string, name: string) => {
        navigate('/negotiation', { state: { sellerId: userId, sellerName: name } });
    };

    return (
        <div className="space-y-6">
            <header className="flex items-center gap-4">
                <Button variant="secondary" onClick={() => navigate(-1)} className="px-2">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h2 className="text-2xl font-semibold text-AgriNiti-text">{label('enquiriesBtn')}</h2>
                    <p className="mt-1 text-sm text-AgriNiti-text-muted">
                        {label('enquiriesSubtitle')}
                    </p>
                </div>
            </header>

            {loading ? (
                <div className="text-center py-10 text-AgriNiti-text-muted">{label('loading' as any) || 'Loading enquiries...'}</div>
            ) : enquiries.length === 0 ? (
                <Card className="p-10 text-center">
                    <MessageCircle className="h-12 w-12 text-AgriNiti-text-muted mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium text-AgriNiti-text mb-2">{label('noEnquiries')}</p>
                    <p className="text-AgriNiti-text-muted">{label('noEnquiriesDesc')}</p>
                </Card>
            ) : (
                <div className="space-y-4">
                    {enquiries.map((enquiry) => (
                        <Card key={enquiry.user_id} className="p-4 hover:shadow-soft-card transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-semibold text-AgriNiti-text text-lg">{enquiry.name}</h3>
                                    <span className="text-xs text-AgriNiti-text-muted flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(enquiry.timestamp).toLocaleString()}
                                    </span>
                                </div>
                                <p className="text-sm text-AgriNiti-text-muted line-clamp-1">{enquiry.last_message}</p>
                            </div>
                            <Button
                                onClick={() => handleOpenChat(enquiry.user_id, enquiry.name)}
                                className="bg-AgriNiti-primary hover:bg-AgriNiti-primary/90 text-white w-full md:w-auto mt-2 md:mt-0"
                            >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                {label('openChatBtn')}
                            </Button>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
