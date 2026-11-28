// The bare URL is printed in MERCY. Preserve existing links to specific guide content.
if (!window.location.search && !window.location.hash) {
  window.location.replace('/learn/?reading-guide=1');
}
