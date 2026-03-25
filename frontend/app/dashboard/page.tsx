'use client';

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const handleNavigation = (path: string) => {
    router.push(path);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">Please log in to access your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-semibold text-gray-900">
                Fintech Payment Platform
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Welcome, {user?.firstName} {user?.lastName}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Overview Card */}
          <div 
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200 cursor-pointer"
            onClick={() => handleNavigation('/dashboard/overview')}
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-blue-500 rounded-md p-2">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002 2zm0 0H9a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002 2zm0 0H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Overview</h3>
                  <p className="mt-1 text-sm text-gray-500">Your account overview and statistics</p>
                </div>
              </div>
            </div>
          </div>

          {/* Subscriptions Card */}
          <div 
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200 cursor-pointer"
            onClick={() => handleNavigation('/dashboard/subscriptions')}
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-green-500 rounded-md p-2">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16a1 1 0 001 1h16a1 1 0 001-1V4a1 1 0 00-1-1H4a2 2 0 00-2 2v16a2 2 0 002 2h16a2 2 0 002 2V6a2 2 0 00-2-2H4z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Subscriptions</h3>
                  <p className="mt-1 text-sm text-gray-500">Manage your active subscriptions</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payments Card */}
          <div 
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200 cursor-pointer"
            onClick={() => handleNavigation('/dashboard/payments')}
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-purple-500 rounded-md p-2">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h1m-7 4h1m-7 4h1" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Payments</h3>
                  <p className="mt-1 text-sm text-gray-500">View payment history and methods</p>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Card */}
          <div 
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200 cursor-pointer"
            onClick={() => handleNavigation('/dashboard/profile')}
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-yellow-500 rounded-md p-2">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 11-8 0 011-8 0 011 8 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Profile</h3>
                  <p className="mt-1 text-sm text-gray-500">Update your account information</p>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Card */}
          <div 
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200 cursor-pointer"
            onClick={() => handleNavigation('/dashboard/settings')}
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gray-500 rounded-md p-2">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.48 0 1.756 3.48 0 1.756-3.48zM4.75 12a4.25 4.25 0 004.25 4.25v15.5c0 2.495 1.005 4.25 4.25h7.5c2.495 0 4.25-1.005 4.25-4.25V12z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Settings</h3>
                  <p className="mt-1 text-sm text-gray-500">Configure your preferences</p>
                </div>
              </div>
            </div>
          </div>

          {/* Support Card */}
          <div 
            className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200 cursor-pointer"
            onClick={() => handleNavigation('/dashboard/support')}
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-red-500 rounded-md p-2">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.636 3.536 3.536M21 12h-8m4 0h8m-4 0h4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">Support</h3>
                  <p className="mt-1 text-sm text-gray-500">Get help and contact support</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Status Section */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Account Status</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="ml-3 text-sm font-medium text-green-800">Your account is active and ready</span>
              </div>
              <div className="text-sm text-gray-600">
                <p>Email: {user?.email}</p>
                <p>Member since: {new Date(user?.createdAt || '').toLocaleDateString()}</p>
                <p>Account type: {user?.role === 'admin' ? 'Administrator' : 'Standard User'}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
