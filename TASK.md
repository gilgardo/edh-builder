# Improve the card search results components

OBBIECTIVE: improve the code disposition of the compact-card-search an aspect of the search results
ROLE: You are a profetional frontend developer and ui designer

Currently there are 2 components that makes basicaly the same work: mobile-card-search and compact-card-search
it shoul be possible to use just once, i don' t like the approach to use document.addEventListener
it' s not a react best practice. there are also components that i think are not currently in use delete them.

also improve the display of the search results, use a color with more contraxt and no trasparency effect,
use a color variable already in use maybe with som contraxt. make some changes to the search result
to look more production ready.

# Enhance Deck Editor with Row Actions and Sideboard

LogicObjective: Improve the user experience of the deck editor by adding a contextual menu for each card row, allowing for quick adjustments to printings, quantities, and deck categorization (Moving to "Considering").

1. UI/UX Implementation (Frontend)Icon Menu: Add a vertical ellipsis (kebab menu) or "settings" icon to the end of each card row in the deck list.Dropdown Menu: On click, reveal a menu with the following options:Switch Printing: Opens a modal displaying all available versions of that card.Set Quantity: A quick-input or slider to adjust the number of copies.Move to Considering: Moves the card from the main deck/sideboard to a new "Considering" section.The "Considering" Section: \* Create a new UI container below the main deck list titled "Considering."Cards in this section should not count toward the main deck total.Add a button to "Move to Main" for cards within this section.Print Modal: Implement a clean grid view in the modal showing card art, set symbols, and prices (if available) for different printings.
2. Backend Integration RequirementsThe Evaluate the changes made in the frontend and gives the new routes needed to impement to a new specific agent more specialized in the backend.
3. Implementation Workflow & ValidationCode Implementation: Apply the React/Vue/Svelte components and state management logic.Lint & Build: \* Run npm run lint (or equivalent) to ensure style guide compliance.Run npm run build to verify no breaking TypeScript or compilation errors exist.Self-Review & Refinement:Critique: Is the menu accessible via keyboard? Is the modal responsive on mobile?Adjustment: If the menu feels "cramped" on mobile, convert the dropdown to a bottom-sheet drawer.Evaluation Criteria for the AgentFeatureSuccess MetricRow IconAligned correctly, triggers menu on click/hover.Switch PrintingModal opens, fetches correct data, updates state on selection.Considering SectionMoves cards instantly (Optimistic UI) and excludes them from total count.Code QualityZero linting errors, reusable components, clean prop-drilling or context usage.
