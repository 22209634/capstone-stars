# Style Guide

*Note.* This is a living document i.e. we will work on it as we go.

## CSS: Using **BEM** (Block, Element, Modifier) methodology

### Example Usage:

```html
<a class="btn btn--big btn--orange" href="#">
  <span class="btn__price">$9.99</span>
  <span class="btn__text">Subscribe</span>
</a>
```

### How?

CSS blocks can just have normal class-name, and elements within blocks will have double underscores between words (element__name), and modifiers will have double hyphen (modifier--name).

### Why BEM?

- To make the CSS easy to understand. Someone unfamiliar with the CSS should still be able to have a good idea of which classes are responsible for what and how they depend on each other.
- Then this person can build their own components and modify existing ones.
- It also has the Tailwind-esque feature of allowing the creation of multiple combinations of objects simply by changing classes in the HTML markup.
