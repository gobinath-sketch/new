import { useState, useEffect } from 'react';
import api from '../services/api';
import './Table.css';
import ClientForm from '../components/ClientForm';

const ClientCreation = ({ user, embedded = false, onClientCreated }) => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(embedded ? true : false);

    useEffect(() => {
        fetchClients();
    }, []);

    const fetchClients = async () => {
        try {
            const response = await api.get('/clients');
            setClients(response.data);
        } catch (error) {
            console.error('Error fetching clients:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleClientCreated = (createdClient) => {
        if (!embedded) {
            setShowForm(false);
        }
        fetchClients();
        if (onClientCreated) {
            onClientCreated(createdClient);
        }
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div>
            {!embedded && (
                <div className="page-header">
                    <h1 className="page-title">Client Creation</h1>
                    {user.role !== 'Director' && (
                        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
                            {showForm ? 'Cancel' : 'Create Client'}
                        </button>
                    )}
                </div>
            )}

            {(showForm || embedded) && user.role !== 'Director' && (
                <ClientForm
                    user={user}
                    onSuccess={handleClientCreated}
                    onCancel={() => setShowForm(false)}
                />
            )}
            {!embedded && (
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Client Name</th>
                                <th>Training Sector</th>
                                <th>Contact Person</th>
                                <th>Email</th>
                                <th>Location</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {clients.map(client => (
                                <tr key={client._id}>
                                    <td>{client.clientName}</td>
                                    <td>{client.trainingSector}</td>
                                    <td>{Array.isArray(client.contactPersonName) ? client.contactPersonName.join(', ') : client.contactPersonName}</td>
                                    <td>{client.emailId}</td>
                                    <td>{client.location}</td>
                                    <td>
                                        <button
                                            onClick={() => window.location.href = `/clients/${client._id}`}
                                            className="btn-small"
                                            style={{ backgroundColor: '#007bff', color: 'white' }}
                                        >
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ClientCreation;
