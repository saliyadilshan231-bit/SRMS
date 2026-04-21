import {
  createKuppiMaterial,
  getAllKuppiMaterials,
  getKuppiMaterialsByModule,
  getKuppiMaterialsByTutor,
  updateKuppiMaterial,
  deleteKuppiMaterial,
} from '@/lib/appwrite';
import { account } from '@/lib/appwrite';

/**
 * Create a new kuppi material
 * @param {Object} data - Material data
 * @param {string} data.moduleId - Module ID
 * @param {string} data.moduleTitle - Module title
 * @param {string} data.title - Material title
 * @param {string} data.description - Material description
 * @param {string} [data.fileUrl] - File URL (optional)
 * @param {string} [data.meetingLink] - Meeting link (optional)
 * @returns {Promise<Object>} Created material document
 */
export async function createKuppiMaterialService(data) {
  try {
    const user = await account.get();
    const material = await createKuppiMaterial({
      tutorId: user.$id,
      moduleId: data.moduleId,
      moduleTitle: data.moduleTitle,
      title: data.title,
      description: data.description,
      fileUrl: data.fileUrl,
      meetingLink: data.meetingLink,
    });
    return material;
  } catch (error) {
    console.error('Error creating kuppi material:', error);
    throw error;
  }
}

/**
 * Get all kuppi materials for students
 * @returns {Promise<Array>} Array of kuppi materials
 */
export async function getAllKuppiMaterialsForStudents() {
  try {
    const materials = await getAllKuppiMaterials();
    return materials;
  } catch (error) {
    console.error('Error fetching kuppi materials:', error);
    return [];
  }
}

/**
 * Get kuppi materials for a specific module
 * @param {string} moduleId - Module ID
 * @returns {Promise<Array>} Array of kuppi materials for the module
 */
export async function getKuppiMaterialsByModuleService(moduleId) {
  try {
    const materials = await getKuppiMaterialsByModule(moduleId);
    return materials;
  } catch (error) {
    console.error('Error fetching kuppi materials by module:', error);
    return [];
  }
}

/**
 * Get kuppi materials created by the current tutor
 * @returns {Promise<Array>} Array of kuppi materials
 */
export async function getMyKuppiMaterials() {
  try {
    const user = await account.get();
    const materials = await getKuppiMaterialsByTutor(user.$id);
    return materials;
  } catch (error) {
    console.error('Error fetching my kuppi materials:', error);
    return [];
  }
}

/**
 * Update a kuppi material
 * @param {string} documentId - Document ID
 * @param {Object} data - Updated data
 * @returns {Promise<void>}
 */
export async function updateKuppiMaterialService(documentId, data) {
  try {
    await updateKuppiMaterial(documentId, data);
  } catch (error) {
    console.error('Error updating kuppi material:', error);
    throw error;
  }
}

/**
 * Delete a kuppi material
 * @param {string} documentId - Document ID
 * @returns {Promise<void>}
 */
export async function deleteKuppiMaterialService(documentId) {
  try {
    await deleteKuppiMaterial(documentId);
  } catch (error) {
    console.error('Error deleting kuppi material:', error);
    throw error;
  }
}
