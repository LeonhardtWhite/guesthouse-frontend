export type RoomCode = "single" | "double" | "family";

export interface Room {
  id: number;
  code: RoomCode;
  name: string;
  total_rooms: number;
  capacity: number | null;
}

export interface BookingPayload {
  check_in: string;
  check_out: string;
  room_type: RoomCode;
  people: number;
  name: string;
  phone: string;
  need_pickup: boolean;
  line_user_id: string;
  line_display_name: string;
}
