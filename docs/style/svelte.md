**Svelte Component Splitting - Detailed Rules** 📏

**Size Thresholds:**

- **50-100 lines**: Still manageable
- **100-200 lines**: Consider splitting if multiple concerns
- **200+ lines**: Definitely split
- **5+ reactive statements** (`$:`) = getting complex
- **3+ lifecycle functions** (`onMount`, `onDestroy`) = look for separation

**Complexity Indicators:**

- More than **3 conditional blocks** (`{#if}`, `{#each}`)
- **4+ event handlers** (`on:click`, `on:submit`)
- **2+ API calls** in one component
- **5+ props** being passed down

**Props vs Stores** 📤

**Use Props When:**

- **1-2 levels max**: `Parent → Child → Grandchild` ✅
- **3-5 props** per component
- Component-specific data

```svelte
<!-- ✅ Good prop usage -->
<UserCard {user} {showActions} />
```

**Use Stores When:**

- **3+ levels**: `A → B → C → D` ❌
- **5+ components** need same data
- **Cross-component communication**

```svelte
<!-- ❌ Too much prop drilling -->
<App>
  <Header {user} {cart} {theme} />
  <Main {user} {cart} />
    <ProductList {user} {cart} />
      <Product {user} {cart} />
</App>

<!-- ✅ Better with stores -->
<script>
  import { user, cart, theme } from './stores.js';
</script>
```

**Store Types & Usage** 🗄️

**Writable Stores:**

- **User authentication** (`$user`)
- **Shopping cart** (`$cart`)
- **Form data** across steps

```js
// stores.js
export const user = writable(null);
export const cart = writable([]);
```

**Derived Stores:**

- **Computed values** (`$cartTotal`)
- **Filtered lists** (`$visibleItems`)

```js
export const cartTotal = derived(cart, ($cart) =>
  $cart.reduce((sum, item) => sum + item.price, 0),
);
```

**Custom Stores:**

- **Complex state logic**
- **API integration**
- **Local storage sync**

```js
function createUser() {
  const { subscribe, set, update } = writable(null);

  return {
    subscribe,
    login: (userData) => set(userData),
    logout: () => set(null),
    updateProfile: (data) => update((u) => ({ ...u, ...data })),
  };
}
```

**Logic Separation Triggers** 🎯

**Split when you have:**

- **Data fetching** + **UI rendering** + **business logic**
- **Form handling** + **validation** + **submission**
- **List management** + **filtering** + **sorting**

**Examples:**

```svelte
<!-- ❌ Too Complex: UserProfile.svelte (300 lines) -->
<script>
  // API calls
  // Form validation
  // File upload logic
  // Activity feed
</script>

<!-- ✅ Better Split: -->
<!-- UserProfile.svelte (orchestrator) -->
<script>
  import UserInfo from './UserInfo.svelte';
  import UserForm from './UserForm.svelte';
  import AvatarUpload from './AvatarUpload.svelte';
  import ActivityFeed from './ActivityFeed.svelte';
</script>

<UserInfo />
<UserForm />
<AvatarUpload />
<ActivityFeed />
```

**Store Decision Tree** 🌳

**Component State (`let`):**

- Form inputs, toggles, temporary UI
- **1 component** needs it

```svelte
<script>
  let isOpen = false;
  let inputValue = '';
</script>
```

**Props:**

- **2-3 related components**
- **Parent-child** communication

**Stores:**

- **4+ unrelated components**
- **Global app state**
- **Persistent data**

**Specific Svelte Patterns** 🎨

**Reactive Statements Limit:**

```svelte
<!-- ❌ Too many reactive statements -->
<script>
  $: filteredItems = items.filter(/* ... */);
  $: sortedItems = filteredItems.sort(/* ... */);
  $: groupedItems = sortedItems.reduce(/* ... */);
  $: totalCount = groupedItems.length;
  $: averagePrice = calculateAverage(groupedItems);
</script>

<!-- ✅ Move to derived store or separate component -->
```

**Event Forwarding vs Stores:**

```svelte
<!-- ✅ Use event forwarding for 1-2 levels -->
<Button on:click />

<!-- ✅ Use stores for complex state changes -->
<script>
  import { notifications } from './stores.js';

  function handleSuccess() {
    notifications.add('Success!');
  }
</script>
```

**Quick Metrics for Svelte** 📊

- **File size**: 200+ lines = split
- **Props**: 7+ props = too many
- **Reactive statements**: 5+ `$:` = complex
- **Stores accessed**: 4+ `$store` = maybe lift logic
- **Event handlers**: 5+ `on:` = split responsibilities
- **Nesting levels**: 3+ prop drilling = store time

**Store vs Context Pattern** 🔄

```svelte
<!-- ✅ For app-wide state -->
import { user } from '$lib/stores/user.js';
$: isLoggedIn = !!$user;

<!-- ✅ For feature-specific context -->
<script>
  import { setContext } from 'svelte';
  setContext('theme', themeStore);
</script>
```

Start simple with props, move to stores when you hit these limits! 🚀
