import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function BatchList() {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchBatches();
  }, [filter]);

  const fetchBatches = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await api.get('/farmer/batches', { params });
      setBatches(response.data);
    } catch (error) {
      console.error('Failed to fetch batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSpoilageColor = (level) => {
    if (level <= 3) return 'text-green-600';
    if (level <= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">My Harvest Batches</h1>
        <Link to="/farmer/batches/new" className="btn-primary">
          Create New Batch
        </Link>
      </div>

      <div className="flex space-x-2">
        {['all', 'available', 'listed', 'sold', 'spoiled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === status
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {batches.length > 0 ? (
            batches.map((batch) => (
              <Link
                key={batch.id}
                to={`/farmer/batches/${batch.id}`}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{batch.cropName}</h3>
                    <p className="text-sm text-gray-600">Batch ID: {batch.batchId}</p>
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

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium text-gray-900">
                      {batch.quantity} {batch.unit}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Harvest Date:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(batch.harvestDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Spoilage Risk:</span>
                    <span className={`font-medium ${getSpoilageColor(batch.spoilageRiskLevel)}`}>
                      Level {batch.spoilageRiskLevel}/10
                    </span>
                  </div>
                </div>

                {batch.qrCodeUrl && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <span className="text-xs text-gray-500">QR Code Available</span>
                  </div>
                )}
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 mb-4">No batches found</p>
              <Link to="/farmer/batches/new" className="btn-primary">
                Create Your First Batch
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
