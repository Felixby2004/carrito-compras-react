"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cupon_controller_1 = require("../controllers/cupon.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
const cuponController = new cupon_controller_1.CuponController();
// Ruta pública para validar cupón
router.post('/validar', cuponController.validarCupon.bind(cuponController));
router.get('/', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('cupones', 'leer'), cuponController.getCuponesAdmin.bind(cuponController));
router.post('/', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('cupones', 'crear'), cuponController.crearCupon.bind(cuponController));
router.put('/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('cupones', 'editar'), cuponController.actualizarCupon.bind(cuponController));
router.delete('/:id', auth_middleware_1.authenticate, (0, rbac_middleware_1.requirePermission)('cupones', 'eliminar'), cuponController.eliminarCupon.bind(cuponController));
exports.default = router;
