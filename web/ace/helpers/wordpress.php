<?php

namespace ace\helpers;

remove_filter( 'the_content', 'wpautop' );
remove_filter( 'the_excerpt', 'wpautop' );
add_action('wp_head', '\ace\helpers\hook_wphead');

function hook_wphead(){
  echo '<meta name="description" content="Hope Chapel Long Beach, 5555 Stearns. Sunday service begins at 10:00am." />';
}