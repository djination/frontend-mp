import React, { useEffect, useState } from 'react';
import { getServices, createService, updateService, deleteService } from '../../api/serviceApi';
import ServiceTree from './components/ServiceTree';
import ServiceForm from './components/ServiceForm';

const ServicesPage = () => {
  const [services, setServices] = useState([]);
  const [editingService, setEditingService] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const fetchServices = async () => {
    try {
      const data = await getServices();
      setServices(data.data);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleAddService = () => {
    setEditingService(null);
    setShowForm(true);
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setShowForm(true);
  };

  const handleDeleteService = async (id) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        await deleteService(id);
        fetchServices();
      } catch (error) {
        console.error('Failed to delete service:', error);
      }
    }
  };

  const handleSubmitForm = async (formData) => {
    try {
      if (editingService) {
        await updateService(editingService.id, formData);
      } else {
        await createService(formData);
      }
      fetchServices();
      setShowForm(false);
      setEditingService(null);
    } catch (error) {
      console.error('Failed to save service:', error);
    }
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingService(null);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Manage Services</h1>
      <button
        onClick={handleAddService}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
      >
        Add New Service
      </button>

      {showForm && (
        <ServiceForm
          service={editingService}
          onSubmit={handleSubmitForm}
          onCancel={handleCancelForm}
          allServices={services}
        />
      )}

      {!showForm && services.length > 0 ? (
        <ServiceTree
          services={services.filter(service => !service.parentId)} // Render top-level services
          onEdit={handleEditService}
          onDelete={handleDeleteService}
        />
      ) : !showForm && (
        <p>No services found. Add a new service to get started.</p>
      )}
    </div>
  );
};

export default ServicesPage; 