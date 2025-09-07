# AI-Oriented Specifications

This document is a working spec for our app to help everyone involved better understand the app and make more meaningful contributions to discussions, designs, code, testing, and more.

## Mission and Problem Statement

**Core mission:** a web-enabled app that lets users remotely control a telescope/mount, watch live video feeds (telescope feed and all-sky camera feed), select visible astronomical objects from a list (and then be able to slew the telescope to those objects if desired), and capture images + metadata for education and research.

**Main users:** Students/Teachers (public outreach), Researchers (imagery and data capture), and System Admins (safety, access, audit).

**Success looks like:** low-latency control + video in standard browsers; correct visibility filtering; safe ops under weather constraints; easy image capture + download; clear role-based access.

For a detailed look at the project, please check the project overview page (project-overview.md).

---

## Style Guide

*Note.* This is a living document i.e. we will work on it as we go.

### CSS: Using **BEM** (Block, Element, Modifier) methodology

#### Example Usage:

```html
<a class="btn btn--big btn--orange" href="#">
  <span class="btn__price">$9.99</span>
  <span class="btn__text">Subscribe</span>
</a>
```

#### How?

CSS blocks can just have normal class-name, and elements within blocks will have double underscores between words (element__name), and modifiers will have double hyphen (modifier--name).

#### Why BEM?

- To make the CSS easy to understand. Someone unfamiliar with the CSS should still be able to have a good idea of which classes are responsible for what and how they depend on each other.
- Then this person can build their own components and modify existing ones.
- It also has the Tailwind-esque feature of allowing the creation of multiple combinations of objects simply by changing classes in the HTML markup.
