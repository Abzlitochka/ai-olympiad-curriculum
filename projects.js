/* ============================================================
   AI Olympiad Curriculum — sprint projects
   Practicum-style "проект" briefs: one independent build at the end
   of each sprint, with a self-review rubric (verifiable yes/no items).
   Keyed by sprint id from SPRINTS in data.js.
   ============================================================ */

const SPRINT_PROJECTS = {
  S1: {
    title: "Submission Craft Kit",
    hours: "~6 h",
    needs: "GPU notebook (own GPU or Kaggle)",
    brief: "Build the reusable plumbing every olympiad notebook needs. Solve all 21 Tensor Puzzles, run the IOAI-2024 'Help BOBAI' baseline end-to-end on one GPU, and package a `make_submission(df, path)` helper that writes an exactly-to-spec submission.csv. Submit the notebook plus the helper file.",
    steps: [
      "Finish all 21 Tensor Puzzles, then re-solve 10 of them from blank, each in under 1 minute",
      "Run the official Help BOBAI baseline notebook top-to-bottom on a single GPU without edits",
      "Write `make_submission(df, path)`: column order from the spec, no index column, UTF-8, round-trips through pandas",
      "Add a `validate_submission(path, sample)` cell that checks shape, columns, dtypes and id coverage against sample_submission.csv",
      "Record wall-clock time per section in a markdown cell, IOAI top-to-bottom style"
    ],
    rubric: [
      "All 21 puzzle solutions pass the gym harness (screenshot or green cell output included)",
      "The notebook runs top-to-bottom with no errors and produces submission.csv in under 60 min on one GPU",
      "submission.csv has exactly the required columns in the required order and parses with `pd.read_csv`",
      "Row count and id set of submission.csv match sample_submission.csv exactly",
      "make_submission is imported/reused in the notebook, not copy-pasted inline",
      "A fixed random seed cell appears before any stochastic code"
    ],
    stretch: "Wrap validation into a tiny CLI (`python submit.py notebook.ipynb`) that refuses to write a file failing spec checks."
  },

  S2: {
    "title": "Pumpkin Prices: Data to Web App",
    "hours": "~8 h",
    "needs": "local JupyterLab (CPU is enough)",
    "brief": "End-to-end regression with the pumpkin data from ML1–ML2. Clean the data, choose features, fit a regression model, compare it with at least one alternative on a held-out test set, save the model with pickle and serve it from a small Flask page that returns a predicted price.",
    "steps": [
      "Load the pumpkin data and write down which columns you keep and why (missing values handled explicitly)",
      "Split into train and test BEFORE any fitting; freeze the split with a fixed random_state",
      "Fit a linear model and a polynomial or multi-feature model; report RMSE on the test set for both",
      "Save the better model with pickle and reload it in a fresh notebook to prove it still predicts",
      "Write a Flask app with a form and a /predict route; describe the request-to-response path in your own words"
    ],
    "rubric": [
      "The test set is never used for fitting, scaling or choosing features",
      "Both models report RMSE on the same test set, and the winner is justified by that number",
      "The reloaded pickle gives the same predictions as the original model",
      "The Flask page returns a price for a valid input and a clear error for an invalid one",
      "The README explains what each file does in no more than 10 lines"
    ],
    "stretch": "Add 5-fold cross-validation and report mean ± std RMSE before declaring a winner."
  },
  S3: {
    "title": "Classifier Showdown and Music Clusters",
    "hours": "~8 h",
    "needs": "local JupyterLab (CPU is enough)",
    "brief": "Two small studies built from ML4 and ML5. (a) On the cuisines data compare at least four classifier families with the same honest train/test protocol. (b) On the Nigerian music data run K-Means, choose k with both the elbow and silhouette scores, and describe the clusters in plain words.",
    "steps": [
      "Prepare the cuisines features and split FIRST; if you balance classes, do it on the training part only",
      "Train at least four classifiers and report test accuracy plus a confusion matrix for the best one",
      "Explain in 3 sentences why the best model might still be wrong on rare classes",
      "Cluster the music data for k = 2..8 and plot inertia and silhouette side by side",
      "Pick k, name each cluster from its average features, and state one reason the clusters could be an artifact"
    ],
    "rubric": [
      "Balancing or scaling happens after the split and never touches test rows",
      "All classifiers use the same split and the same metric",
      "The confusion matrix is read correctly and its axes are stated",
      "The chosen k is supported by two plots, not by one",
      "Cluster ids are never used as if they were class labels"
    ],
    "stretch": "Re-run the study with 3 different random seeds and report how much the ranking changes."
  },
  S4: {
    "title": "Hotel Sentiment and Energy Forecast",
    "hours": "~10 h",
    "needs": "local JupyterLab (CPU is enough)",
    "brief": "Two mini-projects from ML6 and ML7. (a) Classify hotel-review sentiment with a bag-of-words or TF-IDF model and compare it with a ready-made sentiment tool such as VADER. (b) Forecast the energy load series with ARIMA and with SVR, evaluating both on a time-ordered test period.",
    "steps": [
      "Clean the review text, split by rows before fitting the vectorizer, build features and report accuracy",
      "Compare your model with VADER on the same 200 reviews and list 5 cases where they disagree",
      "For the energy series, split by time: train on the past, test on the future",
      "Fit ARIMA and SVR, then compute MAPE and plot predictions against the real values",
      "Write down one way each model could be fooled (leakage, seasonality, outliers)"
    ],
    "rubric": [
      "The vectorizer is fitted on training reviews only",
      "The time-series split never lets the model see the future",
      "MAPE is computed on the test period and its weakness near zero is mentioned",
      "Hyperparameters were chosen without looking at the test period",
      "The disagreement table contains real reviews, not invented examples"
    ],
    "stretch": "Add a naive 'same as yesterday' baseline and show whether your models beat it."
  },
  S5: {
    "title": "Wolf Gridworld and a Debugging Checklist",
    "hours": "~8 h",
    "needs": "local JupyterLab (CPU is enough)",
    "brief": "Teach an agent to reach the apple on the Peter-and-the-wolf board with tabular Q-learning, then turn the ML9 debugging lesson into a checklist you could apply to any model.",
    "steps": [
      "Implement the board, the reward function and the epsilon-greedy policy from ML8",
      "Train a Q-table and plot average steps per episode over training",
      "Change gamma and the learning rate; show one run where learning clearly fails and explain why",
      "Take any earlier project and apply the ML9 debugging ideas (error analysis, data checks, fairness view)",
      "Write a one-page checklist: ten yes/no questions to ask before trusting a model"
    ],
    "rubric": [
      "The learning curve goes down and the agent reaches the apple from random starts",
      "The failing run is reproducible from a seed and the cause is named",
      "Epsilon and the learning rate are shown as numbers, not just described",
      "The checklist items can be answered yes or no",
      "At least two items come from your own debugging, not copied from the lesson"
    ],
    "stretch": "Replace the Q-table with the CartPole Gym task and compare the learning curves."
  },
  S6: {
    "title": "Perceptron From Scratch, Then Two Frameworks",
    "hours": "~10 h",
    "needs": "local JupyterLab (CPU is enough)",
    "brief": "Build the same small network three times: a perceptron in plain NumPy, an MLP with manual backpropagation, and the same MLP in PyTorch or Keras. Show that all versions agree and that the gradients are correct.",
    "steps": [
      "Implement the perceptron update rule and show it converging on linearly separable points",
      "Write an MLP forward and backward pass in NumPy on a small tabular dataset",
      "Check your gradients against finite differences on 5 random weights",
      "Rebuild the model in PyTorch or Keras and train it on the same split",
      "Compare final metrics in one table and explain any difference"
    ],
    "rubric": [
      "Finite-difference and analytic gradients agree to at least 4 decimal places",
      "The perceptron weights and the loss curve are plotted",
      "Both implementations use the same seed, split and metric",
      "The table shows the framework result next to your NumPy result",
      "The model beats a logistic-regression baseline, or the report explains honestly why not"
    ],
    "stretch": "Add momentum or Adam to the NumPy version and compare the loss curves."
  },
  S7: {
    "title": "Fine-tune a CNN and Read a Detector",
    "hours": "~12 h",
    "needs": "local JupyterLab; a GPU helps but is not required for a small dataset",
    "brief": "Fine-tune a pretrained CNN on a small image set of your own (about 100 images per class, 2-3 classes), then run the detection and segmentation notebooks from AI2 and interpret their outputs with IoU and precision/recall.",
    "steps": [
      "Collect or choose a small labeled image set and split it before any training",
      "Freeze a pretrained backbone, train a new final layer, then unfreeze and fine-tune with a small learning rate",
      "Report accuracy and a confusion matrix on the held-out images",
      "Run the detection notebook on 5 images and compute IoU by hand for two boxes",
      "Run the segmentation notebook and describe one mistake the mask makes"
    ],
    "rubric": [
      "Test images were never used for training or for picking the epoch",
      "Fine-tuning beats training the same CNN from scratch on the same data, or the report explains why not",
      "IoU is computed with the formula, not read from a library, for at least two boxes",
      "Augmentations are applied to training images only",
      "The report states how many parameters were trained in each phase"
    ],
    "stretch": "Plot training and validation loss and mark where overfitting begins."
  },
  S8: {
    "title": "Embeddings and a Transformer NER Tagger",
    "hours": "~12 h",
    "needs": "local JupyterLab; a GPU helps for fine-tuning",
    "brief": "Train word embeddings on a small corpus, inspect which words end up close together, then fine-tune a pretrained transformer for named-entity recognition and evaluate it with entity-level F1.",
    "steps": [
      "Tokenize a small corpus and train skip-gram or CBOW embeddings; print nearest neighbours for 10 words",
      "Test one analogy and explain, in one paragraph, why it works or fails on such a small corpus",
      "Prepare an NER dataset with token-level tags and split it by sentence",
      "Fine-tune a pretrained transformer and report precision, recall and F1 per entity type",
      "Show 5 wrong predictions and say what kind of error each is"
    ],
    "rubric": [
      "The embedding corpus and the NER test set do not overlap",
      "Nearest-neighbour lists are shown for real words, with a note on corpus size",
      "F1 is computed on whole entities, not on single tokens",
      "The fine-tuning learning rate and epochs are reported",
      "Error analysis names a pattern rather than only listing examples"
    ],
    "stretch": "Compare your embeddings with a pretrained set on the same neighbour test."
  },
  S9: {
    "title": "Deep-RL Notebook and Family Ontology",
    "hours": "~10 h",
    "needs": "local JupyterLab (CPU is enough)",
    "brief": "Close the course with two pieces from AI4 and MATH1. (a) Run and extend the deep-RL notebook so a policy-gradient agent balances CartPole. (b) Build the family ontology expert-system exercise and show that it answers questions the facts do not state directly.",
    "steps": [
      "Run the policy-gradient notebook and plot episode reward over training",
      "Change one hyperparameter and show its effect with a second curve",
      "Write a small ontology (people, parent_of) and at least 6 rules",
      "Ask three questions that require two inference steps and show the answers",
      "Write half a page on one ethical risk of each system and how you would reduce it"
    ],
    "rubric": [
      "Reward curves have labeled axes and the hyperparameter change is stated",
      "The agent solves CartPole in at least one seed, or the report explains the failure",
      "Each inferred fact can be traced back to rules and facts",
      "At least one answer is something you did not write down as a fact",
      "The ethics paragraph names a concrete harm, not a general worry"
    ],
    "stretch": "Add a second agent to a simple game and compare cooperative and competitive reward designs."
  }
};
