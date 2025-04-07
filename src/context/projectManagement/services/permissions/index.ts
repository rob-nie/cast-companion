
export * from './isProjectOwner';
export * from './isProjectEditor';
export * from './canViewProject';
export * from './withProjectPermission';

/**
 * Funktion zum Import in den index.ts der Services
 */
export const initPermissionService = () => {
  console.log("Permission service initialized");
};
