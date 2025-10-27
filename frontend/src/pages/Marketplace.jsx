import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Marketplace() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    cropName: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'date_newest',
  });

  useEffect(() => {
    fetchListings();
  }, [filters]);

  const fetchListings = async () => {
    try {
      const params = {};
      if (filters.cropName) params.cropName = filters.cropName;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.sortBy) params.sortBy = filters.sortBy;

      const response = await api.get('/marketplace/listings', { params });
      setListings(response.data);
    } catch (error) {
      console.error('Failed to fetch listings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
        <p className="text-gray-600 mt-2">Browse fresh produce from local farmers</p>
      </div>

      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Search crop..."
            className="input-field"
            value={filters.cropName}
            onChange={(e) => setFilters({ ...filters, cropName: e.target.value })}
          />
          <input
            type="number"
            placeholder="Min price"
            className="input-field"
            value={filters.minPrice}
            onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
          />
          <input
            type="number"
            placeholder="Max price"
            className="input-field"
            value={filters.maxPrice}
            onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
          />
          <select
            className="input-field"
            value={filters.sortBy}
            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
          >
            <option value="date_newest">Newest First</option>
            <option value="date_oldest">Oldest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.length > 0 ? (
            listings.map((listing) => (
              <Link
                key={listing.id}
                to={`/marketplace/listings/${listing.id}`}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{listing.cropName}</h3>
                    <p className="text-sm text-gray-600">by {listing.farmer?.name}</p>
                  </div>
                  {listing.isActive && (
                    <span className="badge badge-success">Active</span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-baseline">
                    <span className="text-2xl font-bold text-primary-600">
                      ${listing.pricePerUnit}
                    </span>
                    <span className="text-sm text-gray-600">per {listing.unit}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Available:</span>
                    <span className="font-medium text-gray-900">
                      {listing.quantity} {listing.unit}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium text-gray-900">
                      {listing.farmer?.location?.address || 'N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Rating:</span>
                    <span className="font-medium text-gray-900">
                      {listing.farmer?.rating ? `${listing.farmer.rating}/5` : 'No ratings'}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-gray-200 flex justify-between text-xs text-gray-500">
                    <span>{listing.viewsCount || 0} views</span>
                    <span>{listing.inquiriesCount || 0} inquiries</span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No listings found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
