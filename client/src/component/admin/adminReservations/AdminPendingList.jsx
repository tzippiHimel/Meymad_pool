import React from 'react';
import ApiService from '../../../ApiService';
import AdminReservationTable from './AdminReservationTable';

export default function AdminPendingList() {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <AdminReservationTable
      fetchReservations={async () => {
        return await ApiService.request({ endPath: `reservations?status=pending&start=${today}`, credentials: 'include' });
      }}
      tableTitle="הזמנות ממתינות לאישור"
      tableColor="#1976d2"
      badgeColor="secondary"
      badgeLabel="ניהול וטיפול בהזמנות הממתינות לאישור"
      approveButtonLabel="אשר"
      approveButtonTooltip="אשר הזמנה"
      showReject={true}
      emptyMessage="אין הזמנות ממתינות לאישור"
      approveAlertMessage="ההזמנה אושרה וההזמנות המתנגשות בוטלו"
    />
  );
}