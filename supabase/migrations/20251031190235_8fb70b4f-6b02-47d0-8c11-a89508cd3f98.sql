-- Migration 1: Adicionar delivery_driver ao enum app_role
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'delivery_driver';