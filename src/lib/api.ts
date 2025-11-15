import type { BookingPayload, Room } from "@/types/booking";

const API_BASE = (import.meta.env.VITE_API_BASE || "http://localhost:10000").replace(/\/$/, "");

export async function fetchRooms(): Promise<Room[]> {
  const res = await fetch(`${API_BASE}/api/rooms`);
  if (!res.ok) {
    throw new Error("Failed to fetch rooms");
  }
  return res.json();
}

export async function createBooking(payload: BookingPayload): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE}/api/bookings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorBody = await res.json().catch(() => null);
    throw new Error(errorBody?.error || "Failed to create booking");
  }

  return res.json();
}
