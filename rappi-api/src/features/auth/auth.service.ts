import { AuthenticateUserDTO, CreateUserDTO, UserRole } from './auth.types';
import Boom from '@hapi/boom';
import { supabase } from '../../config/supabase'
import {
  AuthResponse,
  AuthTokenResponsePassword,
} from '@supabase/supabase-js';
import { pool } from '../../config/database';


export const authenticateUserService = async (
  credentials: AuthenticateUserDTO
): Promise<AuthTokenResponsePassword['data'] & { storeId?: string }> => {
  const signInResponse = await supabase.auth.signInWithPassword({
    email: credentials.email,
    password: credentials.password,
  });

  if (signInResponse.error) {
    throw Boom.unauthorized(signInResponse.error.message);
  }

  return signInResponse.data;
};


export const createUserService = async (
  user: CreateUserDTO
): Promise<AuthResponse['data']> => {
  const signUpResponse = await supabase.auth.signUp({
    email: user.email,
    password: user.password,
    options: {
      data: {
        name: user.name,
        role: user.role,
      },
    },
  });

  if (signUpResponse.error) {
    throw Boom.badRequest(signUpResponse.error.message);
  }

  const authUser = signUpResponse.data.user;

  if (!authUser) {
    throw Boom.internal('Error creating user in auth');
  }

  try {
    await pool.query(
      `INSERT INTO users (id, email, name, role, password)
      VALUES ($1, $2, $3, $4, $5)`,
      [authUser.id, user.email, user.name, user.role, user.password]
    );

    if (user.role === UserRole.STORE) {
      if (!user.storeName) {
        throw Boom.badRequest('Store name is required for store role');
      }

      await pool.query(
        `INSERT INTO stores (name, userId) VALUES ($1, $2)`,
        [user.storeName, authUser.id]
      );
    }

  } catch (error) {
    console.error('Database sync error:', error);
    throw Boom.internal("Data base error while creating user");
  }

  return signUpResponse.data;
};