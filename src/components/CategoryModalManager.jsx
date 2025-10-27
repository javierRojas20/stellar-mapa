import React from 'react';
import SchoolDetailsModal from './SchoolDetailsModal';
import HospitalDetailsModal from './HospitalDetailsModal';
import SubdivisionDetailsModal from './SubdivisionDetailsModal';
import PublixDetailsModal from './PublixDetailsModal';
import MasterPlanDetailsModal from './MasterPlanDetailsModal';
import LandParcelDetailsModal from './LandParcelDetailsModal';
import RentCompDetailsModal from './RentCompDetailsModal';
import RentDetailsModal from './RentDetailsModal';
import DealDetailsModal from './DealDetailsModal';

const CategoryModalManager = ({ 
  deal, 
  isOpen, 
  onClose, 
  loading = false 
}) => {
  if (!isOpen || !deal) return null;

  // Determinar qué modal mostrar basado en la categoría
  const getModalComponent = () => {
    let category = deal.category;
    const categoryId = deal.categoryId;

    console.log(`🔍 CategoryModalManager - Category: ${category}, CategoryId: ${categoryId}`);
    console.log(`🔍 Deal data:`, deal);
    console.log(`🔍 Deal category type:`, typeof category);
    console.log(`🔍 Deal categoryId type:`, typeof categoryId);
    console.log(`🔍 Deal categoryName:`, deal.categoryName);
    console.log(`🔍 Deal category slug from MapboxMap:`, deal.category);

    // Si category es un número, buscar el slug correspondiente
    if (typeof category === 'number') {
      // Usar categoryName si está disponible para una detección más precisa
      if (deal.categoryName) {
        const nameMap = {
          'Master Plans': 'masterPlans',
          'Schools': 'schools',
          'Hospitals': 'hospitals',
          'Subdivisions': 'subdivisions',
          'Publix Locations': 'publix',
          'Rent Comps': 'rents', // Cambiado: usar 'rents' para 'Rent Comps'
          'Rent': 'rents', // Alias para 'Rent'
          'Land Parcels': 'landParcels',
          'Land': 'landParcels' // Alias para 'Land'
        };
        category = nameMap[deal.categoryName] || category;
        console.log(`🔍 Converted categoryName "${deal.categoryName}" to slug: ${category}`);
      } else {
        // Fallback al mapeo por ID
        const categoryMap = {
          1: 'masterPlans',
          2: 'subdivisions', 
          3: 'landParcels', // ID 3 es Land Parcels, no Master Plans
          4: 'rents', // ID 4 es Rent Comps (rents), no publixLocations
          5: 'publix',
          6: 'hospitals',
          7: 'schools'
        };
        category = categoryMap[category] || category;
        console.log(`🔍 Converted category ID ${deal.category} to slug: ${category}`);
      }
    }

    // Master Plans - MOVED UP to check first
    if (category === 'masterPlans' || categoryId === 1) {
      console.log(`✅ Rendering MasterPlanDetailsModal for Master Plans for category: ${category}, categoryId: ${categoryId}`);
      return (
        <MasterPlanDetailsModal
          masterPlan={deal}
          isOpen={isOpen}
          onClose={onClose}
          loading={loading}
        />
      );
    }

    // Schools
    if (category === 'schools' || categoryId === 7) {
      console.log(`✅ Rendering SchoolDetailsModal for category: ${category}, categoryId: ${categoryId}`);
      return (
        <SchoolDetailsModal
          school={deal}
          isOpen={isOpen}
          onClose={onClose}
          loading={loading}
        />
      );
    }

    // Hospitals
    if (category === 'hospitals' || category === 'healthcareFacilities' || categoryId === 6) {
      console.log(`✅ Rendering HospitalDetailsModal for category: ${category}, categoryId: ${categoryId}`);
      return (
        <HospitalDetailsModal
          hospital={deal}
          isOpen={isOpen}
          onClose={onClose}
          loading={loading}
        />
      );
    }

    // Rent Comps - MOVED UP to check before Publix
    if (category === 'rentComps' || category === 'rent' || category === 'rents' || categoryId === 4) {
      console.log(`✅ Rendering RentDetailsModal for category: ${category}, categoryId: ${categoryId}`);
      return (
        <RentDetailsModal
          rent={deal}
          isOpen={isOpen}
          onClose={onClose}
          loading={loading}
        />
      );
    }

    // Publix Locations
    if (category === 'publix' || category === 'publixLocations') {
      console.log(`✅ Rendering PublixDetailsModal for category: ${category}, categoryId: ${categoryId}`);
      return (
        <PublixDetailsModal
          publix={deal}
          isOpen={isOpen}
          onClose={onClose}
          loading={loading}
        />
      );
    }

    // Subdivisions
    if (category === 'subdivisions' || categoryId === 2) {
      console.log(`✅ Rendering SubdivisionDetailsModal for category: ${category}, categoryId: ${categoryId}`);
      return (
        <SubdivisionDetailsModal
          subdivision={deal}
          isOpen={isOpen}
          onClose={onClose}
          loading={loading}
        />
      );
    }

    // Land Parcels
    if (category === 'landParcels' || category === 'land' || categoryId === 3) {
      console.log(`✅ Rendering LandParcelDetailsModal for category: ${category}, categoryId: ${categoryId}`);
      return (
        <LandParcelDetailsModal
          landParcel={deal}
          isOpen={isOpen}
          onClose={onClose}
          loading={loading}
        />
      );
    }

    // Default modal para otras categorías
    return (
      <DealDetailsModal
        deal={deal}
        isOpen={isOpen}
        onClose={onClose}
        loading={loading}
      />
    );
  };

  return getModalComponent();
};

export default CategoryModalManager;
