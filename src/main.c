#include "pebble.h"
static Window *window;

static TextLayer *player_layer;
static TextLayer *rank_layer;
static TextLayer *winloss_layer;

static AppSync sync;
static uint8_t sync_buffer[64];

enum LoLKey {
  LOL_PLAYER_KEY = 0x0,         // TUPLE_CSTRING
  LOL_RANK_KEY = 0x1,  			// TUPLE_CSTRING
  LOL_WINLOSS_KEY = 0x2,        // TUPLE_CSTRING
};

static void sync_error_callback(DictionaryResult dict_error, AppMessageResult app_message_error, void *context) {
  APP_LOG(APP_LOG_LEVEL_DEBUG, "App Message Sync Error: %d", app_message_error);
}

static void sync_tuple_changed_callback(const uint32_t key, const Tuple* new_tuple, const Tuple* old_tuple, void* context) {
  switch (key) {
	 // App Sync keeps new_tuple in sync_buffer, so we may use it directly
    case LOL_PLAYER_KEY: 
      text_layer_set_text(player_layer, new_tuple->value->cstring);
      break;

    case LOL_RANK_KEY:
      text_layer_set_text(rank_layer, new_tuple->value->cstring);
      break;

    case LOL_WINLOSS_KEY:
      text_layer_set_text(winloss_layer, new_tuple->value->cstring);
      break;
  }
}

static void send_cmd(void) {
  Tuplet value = TupletInteger(4, 1);

  DictionaryIterator *iter;
  app_message_outbox_begin(&iter);

  if (iter == NULL) {
    return;
  }

  dict_write_tuplet(iter, &value);
  dict_write_end(iter);

  app_message_outbox_send();
}

static void window_load(Window *window) {
  Layer *window_layer = window_get_root_layer(window);
  //self reminder: GRect(x, y, width, height)
  
  //A few variables to help space things and maintain uniformity
  static int x_offset = 2;
  static int y_spacer = 20;
  static int line_width = 130;
	
  //player name text layer (for LOL_PLAYER_KEY)
  player_layer = text_layer_create(GRect(x_offset, 80, line_width, 50));
  text_layer_set_text_color(player_layer, GColorBlack);
  text_layer_set_background_color(player_layer, GColorClear);
  text_layer_set_font(player_layer, fonts_get_system_font(FONT_KEY_GOTHIC_28_BOLD));
  text_layer_set_text_alignment(player_layer, GTextAlignmentCenter);
  layer_add_child(window_layer, text_layer_get_layer(player_layer));

  //rank text layer, for tier, division and LP information
  rank_layer = text_layer_create(GRect(x_offset, 100+y_spacer, line_width, 20));
  text_layer_set_text_color(rank_layer, GColorBlack);
  text_layer_set_background_color(rank_layer, GColorClear);
  text_layer_set_font(rank_layer, fonts_get_system_font(FONT_KEY_GOTHIC_18));
  text_layer_set_text_alignment(rank_layer, GTextAlignmentCenter);
  layer_add_child(window_layer, text_layer_get_layer(rank_layer));

  //win loss text layer for game record information
  winloss_layer = text_layer_create(GRect(x_offset, 120+y_spacer, line_width, 15));
  text_layer_set_text_color(winloss_layer, GColorBlack);
  text_layer_set_background_color(winloss_layer, GColorClear);
  text_layer_set_font(winloss_layer, fonts_get_system_font(FONT_KEY_GOTHIC_14));
  text_layer_set_text_alignment(winloss_layer, GTextAlignmentCenter);
  layer_add_child(window_layer, text_layer_get_layer(winloss_layer));

  //a few initial values while the app does its thing
  Tuplet initial_values[] = {
    TupletCString(LOL_PLAYER_KEY, "Solo Q Stats"),
    TupletCString(LOL_RANK_KEY, "--LOADING--"),
    TupletCString(LOL_WINLOSS_KEY, "Please wait..."), 
  };

  app_sync_init(&sync, sync_buffer, sizeof(sync_buffer), initial_values, ARRAY_LENGTH(initial_values), sync_tuple_changed_callback, sync_error_callback, NULL);
  send_cmd();
}

static void window_unload(Window *window) {
  //pack it up
  app_sync_deinit(&sync);
  text_layer_destroy(player_layer);
  text_layer_destroy(rank_layer);
  text_layer_destroy(winloss_layer);
}

static void init(void) {
  window = window_create();
  window_set_background_color(window, GColorWhite);
  window_set_fullscreen(window, true);
  window_set_window_handlers(window, (WindowHandlers) {
    .load = window_load,
    .unload = window_unload
  });

  const int inbound_size = 64;
  const int outbound_size = 64;
  app_message_open(inbound_size, outbound_size);

  const bool animated = true;
  window_stack_push(window, animated);
}

static void deinit(void) {
  window_destroy(window);
}

int main(void) {
  init();
  app_event_loop();
  deinit();
}
