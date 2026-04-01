// src/services/restaurantService.js 
// ─── Fetch restaurants and menus from Supabase 

import { supabase } from "../lib/supabase"; 
 
// ── GET ALL RESTAURANTS 

// Pass userNeighborhood to sort nearby ones to the top in the UI 
// (Supabase doesn't do custom sort natively here, so we sort in JS after fetch) 
export async function getRestaurants({ city } = {}) { 
  let query = supabase 
    .from("restaurants") 
    .select(` 
      id, name, description, cuisine_tags, neighborhood, city, 
      address, phone, emoji, rating, review_count, 
      delivery_time, delivery_fee, min_order, 
      is_open, is_featured, logo_url, banner_url 
    `) 
    .order("is_featured", { ascending: false }) 
    .order("rating", { ascending: false }); 
 
  // !! REPLACE "Lagos" with dynamic city detection / user preference !! 
  if (city) { 
    query = query.eq("city", city); 
  } 
 
  const { data, error } = await query; 

  
  return { restaurants: data || [], error }; 
} 
 
 
// ── GET SINGLE RESTAURANT 

export async function getRestaurant(restaurantId) { 
  const { data, error } = await supabase 
    .from("restaurants") 
    .select("*") 
    .eq("id", restaurantId) 
    .single(); 
  return { restaurant: data, error }; 
} 
 
 
// ── GET MENU FOR A RESTAURANT 

// Returns categories with their items nested inside 
export async function getMenu(restaurantId) { 
  // Fetch categories 
  const { data: categories, error: catError } = await supabase 
    .from("menu_categories") 
    .select("id, name, sort_order") 
    .eq("restaurant_id", restaurantId) 
    .order("sort_order"); 
 
  if (catError) return { menu: [], error: catError }; 
 
  // Fetch all available items for this restaurant 
  const { data: items, error: itemError } = await supabase 
    .from("menu_items") 
    .select(` 
      id, name, description, price, emoji, 
      image_url, is_popular, is_available, 
      allergens, category_id 
    `) 
    .eq("restaurant_id", restaurantId) 
    .eq("is_available", true) 
    .order("is_popular", { ascending: false }); 
 
  if (itemError) return { menu: [], error: itemError }; 
 
  // Nest items under their categories 
  const menu = categories.map(cat => ({ 
    ...cat, 
    items: items.filter(item => item.category_id === cat.id), 
  })); 
 
  // Also include uncategorised items if any 
  const uncategorised = items.filter(item => !item.category_id); 
  if (uncategorised.length > 0) { 
    menu.push({ id: null, name: "Other", sort_order: 999, items: uncategorised }); 
  } 
 
  return { menu, error: null }; 
} 
 
 
// ── GET FEATURED RESTAURANTS 
export async function getFeaturedRestaurants() { 
  
  
  const { data, error } = await supabase 
    .from("restaurants") 
    .select("*") 
    .eq("is_featured", true)
    .limit(4);
   
    


    
  return { featured: data || [], error }; 
} 


 
// ── SEARCH RESTAURANTS 

// !! NOTE: For full-text search, enable pg_trgm extension in Supabase 
// !! Dashboard → Database → Extensions → pg_trgm → Enable 
export async function searchRestaurants(query) { 
  const { data, error } = await supabase 
    .from("restaurants") 
    .select("id, name, cuisine_tags, emoji, rating, delivery_time, delivery_fee, neighborhood, is_open, city") 
    .or(`name.ilike.%${query}%,neighborhood.ilike.%${query}%`) 
    .order("rating", { ascending: false }); 
 
  // Also filter by cuisine tags (array contains) 
  // .contains("cuisine_tags", [query])  ← use this for exact tag match 
 
  return { results: data || [], error }; 
} 
 
