import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function FarmerDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/farmer/dashboard');
      setDashboard(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Farmer Dashboard</h1>
        <Link to="/farmer/batches/new" className="btn-primary">
          Create New Batch
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
          <h3 className="text-sm font-medium opacity-90">Total Batches</h3>
          <p className="text-4xl font-bold mt-2">{dashboard?.totalBatches || 0}</p>
        </div>

        <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
          <h3 className="text-sm font-medium opacity-90">Available</h3>
          <p className="text-4xl font-bold mt-2">{dashboard?.availableBatches || 0}</p>
        </div>

        <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <h3 className="text-sm font-medium opacity-90">Listed</h3>
          <p className="text-4xl font-bold mt-2">{dashboard?.listedBatches || 0}</p>
        </div>

        <div className="card bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <h3 className="text-sm font-medium opacity-90">Sold</h3>
          <p className="text-4xl font-bold mt-2">{dashboard?.soldBatches || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Batches</h2>
          <div className="space-y-3">
            {dashboard?.recentBatches?.length > 0 ? (
              dashboard.recentBatches.map((batch) => (
                <Link
                  key={batch.id}
                  to={`/farmer/batches/${batch.id}`}
                  className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-gray-900">{batch.cropName}</h3>
                      <p className="text-sm text-gray-600">
                        {batch.quantity} {batch.unit}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Harvested: {new Date(batch.harvestDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`badge ${
                        batch.currentStatus === 'available'
                          ? 'badge-success'
                          : batch.currentStatus === 'listed'
                          ? 'badge-info'
                          : batch.currentStatus === 'sold'
                          ? 'badge-warning'
                          : 'badge-danger'
                      }`}
                    >
                      {batch.currentStatus}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No batches yet</p>
            )}
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Inquiries</h2>
          <div className="space-y-3">
            {dashboard?.recentInquiries?.length > 0 ? (
              dashboard.recentInquiries.map((inquiry) => (
                <div
                  key={inquiry.id}
                  className="p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{inquiry.buyerName}</h3>
                      <p className="text-sm text-gray-600">{inquiry.listingTitle}</p>
                    </div>
                    <span className={`badge ${
                      inquiry.status === 'pending' ? 'badge-warning' :
                      inquiry.status === 'responded' ? 'badge-info' : 'badge-success'
                    }`}>
                      {inquiry.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{inquiry.message}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(inquiry.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No inquiries yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
