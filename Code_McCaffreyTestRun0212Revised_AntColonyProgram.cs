using System;

// Demo of Ant Colony Optimization (ACO) solving a Traveling Salesman Problem (TSP).
// There are many variations of ACO; this is just one approach.
// The problem to solve has a program defined number of cities. We assume that every
// city is connected to every other city. The distance between cities is artificially
// set so that the distance between any two cities is a random value between 1 and 8
// Cities wrap, so if there are 20 cities then D(0,19) = D(19,0).
// Free parameters are alpha, beta, rho, and Q. Hard-coded constants limit min and max
// values of pheromones.

namespace AntColony
{
  class AntColonyProgram
  {
    static Random random = new Random(0);

    static int alpha = 3; // influence of pheromone on direction
    static int beta = 2;  // influence of adjacent node distance

    static double rho = 0.01; // pheromone decrease factor
    static double Q = 2.0;   // pheromone increase factor

    static void Main(string[] args)
    {
      try
      {
        Console.WriteLine("\nBegin Ant Colony Optimization demo\n");

        int numCities = 60;
        int numAnts = 4;
        int maxTime = 1000;

        Console.WriteLine("Number cities in problem = " + numCities);

        Console.WriteLine("\nNumber ants = " + numAnts);
        Console.WriteLine("Maximum time = " + maxTime);

        Console.WriteLine("\nAlpha (pheromone influence) = " + alpha);
        Console.WriteLine("Beta (local node influence) = " + beta);
        Console.WriteLine("Rho (pheromone evaporation coefficient) = " + rho.ToString("F2"));
        Console.WriteLine("Q (pheromone deposit factor) = " + Q.ToString("F2"));

        Console.WriteLine("\nInitialing dummy graph distances");
        int[][] dists = MakeGraphDistances(numCities);

        Console.WriteLine("\nInitialing ants to random trails\n");
        int[][] ants = InitAnts(numAnts, numCities); // initialize ants to random trails
        ShowAnts(ants, dists);

        int[] bestTrail = BestTrail(ants, dists); // determine the best initial trail
        double bestLength = Length(bestTrail, dists); // the length of the best trail

        Console.Write("\nBest initial trail length: " + bestLength.ToString("F1") + "\n");
        //Display(bestTrail);

        Console.WriteLine("\nInitializing pheromones on trails");
        double[][] pheromones = InitPheromones(numCities);

        int time = 0;
        Console.WriteLine("\nEntering UpdateAnts - UpdatePheromones loop\n");
        while (time < maxTime)
        {
          UpdateAnts(ants, pheromones, dists);
          UpdatePheromones(pheromones, ants, dists);

          int[] currBestTrail = BestTrail(ants, dists);
          double currBestLength = Length(currBestTrail, dists);
          if (currBestLength < bestLength)
          {
            bestLength = currBestLength;
            bestTrail = currBestTrail;
            Console.WriteLine("New best length of " + bestLength.ToString("F1") + " found at time " + time);
          }
          ++time;
        }

        Console.WriteLine("\nTime complete");

        Console.WriteLine("\nBest trail found:");
        Display(bestTrail);
        Console.WriteLine("\nLength of best trail found: " + bestLength.ToString("F1"));

        Console.WriteLine("\nEnd Ant Colony Optimization demo\n");
        Console.ReadLine();
      }
      catch (Exception ex)
      {
        Console.WriteLine(ex.Message);
        Console.ReadLine();
      }

    } // Main

    // --------------------------------------------------------------------------------------------

    static int[][] InitAnts(int numAnts, int numCities)
    {
      int[][] ants = new int[numAnts][];
      for (int k = 0; k < numAnts; ++k)
      {
        int start = random.Next(0, numCities);
        ants[k] = RandomTrail(start, numCities);
      }
      return ants;
    }

    static int[] RandomTrail(int start, int numCities) // helper for InitAnts
    {
      int[] trail = new int[numCities];

      for (int i = 0; i < numCities; ++i) { trail[i] = i; } // sequential

      for (int i = 0; i < numCities; ++i) // Fisher-Yates shuffle
      {
        int r = random.Next(i, numCities);
        int tmp = trail[r]; trail[r] = trail[i]; trail[i] = tmp;
      }

      int idx = IndexOfTarget(trail, start); // put start at [0]
      int temp = trail[0];
      trail[0] = trail[idx];
      trail[idx] = temp;

      return trail;
    }

    static int IndexOfTarget(int[] trail, int target) // helper for RandomTrail
    {
      for (int i = 0; i < trail.Length; ++i)
      {
        if (trail[i] == target)
          return i;
      }
      throw new Exception("Target not found in IndexOfTarget");
    }

    static double Length(int[] trail, int[][] dists) // total length of a trail
    {
      double result = 0.0;
      for (int i = 0; i < trail.Length - 1; ++i)
        result += Distance(trail[i], trail[i + 1], dists);
      return result;
    }

    // -------------------------------------------------------------------------------------------- 

    static int[] BestTrail(int[][] ants, int[][] dists) // best trail has shortest total length
    {
      double bestLength = Length(ants[0], dists);
      int idxBestLength = 0;
      for (int k = 1; k < ants.Length; ++k)
      {
        double len = Length(ants[k], dists);
        if (len < bestLength)
        {
          bestLength = len;
          idxBestLength = k;
        }
      }
      int numCities = ants[0].Length;
      int[] bestTrail = new int[numCities];
      ants[idxBestLength].CopyTo(bestTrail, 0);
      return bestTrail;
    }

    // --------------------------------------------------------------------------------------------

    static double[][] InitPheromones(int numCities)
    {
      double[][] pheromones = new double[numCities][];
      for (int i = 0; i < numCities; ++i)
        pheromones[i] = new double[numCities];
      for (int i = 0; i < pheromones.Length; ++i)
        for (int j = 0; j < pheromones[i].Length; ++j)
          pheromones[i][j] = 0.01; // otherwise first call to UpdateAnts -> BuiuldTrail -> NextNode -> MoveProbs => all 0.0 => throws
      return pheromones;
    }

    // --------------------------------------------------------------------------------------------

    static void UpdateAnts(int[][] ants, double[][] pheromones, int[][] dists)
    {
      int numCities = pheromones.Length;
      for (int k = 0; k < ants.Length; ++k)
      {
        int start = random.Next(0, numCities);
        int[] newTrail = BuildTrail(k, start, pheromones, dists);
        ants[k] = newTrail;
      }
    }

    static int[] BuildTrail(int k, int start, double[][] pheromones, int[][] dists)
    {
      int numCities = pheromones.Length;
      int[] trail = new int[numCities];
      bool[] visited = new bool[numCities];
      trail[0] = start;
      visited[start] = true;
      for (int i = 0; i < numCities - 1; ++i)
      {
        int cityX = trail[i];
        int next = NextCity(k, cityX, visited, pheromones, dists);
        trail[i + 1] = next;
        visited[next] = true;
      }
      return trail;
    }

    static int NextCity(int k, int cityX, bool[] visited, double[][] pheromones, int[][] dists)
    {
      // for ant k (with visited[]), at nodeX, what is next node in trail?
      double[] probs = MoveProbs(k, cityX, visited, pheromones, dists);

      double[] cumul = new double[probs.Length + 1];
      for (int i = 0; i < probs.Length; ++i)
        cumul[i + 1] = cumul[i] + probs[i]; // consider setting cumul[cuml.Length-1] to 1.00

      double p = random.NextDouble();

      for (int i = 0; i < cumul.Length - 1; ++i)
        if (p >= cumul[i] && p < cumul[i + 1])
          return i;
      throw new Exception("Failure to return valid city in NextCity");
    }

    static double[] MoveProbs(int k, int cityX, bool[] visited, double[][] pheromones, int[][] dists)
    {
      // for ant k, located at nodeX, with visited[], return the prob of moving to each city
      int numCities = pheromones.Length;
      double[] taueta = new double[numCities]; // inclues cityX and visited cities
      double sum = 0.0; // sum of all tauetas
      for (int i = 0; i < taueta.Length; ++i) // i is the adjacent city
      {
        if (i == cityX)
          taueta[i] = 0.0; // prob of moving to self is 0
        else if (visited[i] == true)
          taueta[i] = 0.0; // prob of moving to a visited city is 0
        else
        {
          taueta[i] = Math.Pow(pheromones[cityX][i], alpha) * Math.Pow((1.0 / Distance(cityX, i, dists)), beta); // could be huge when pheromone[][] is big
          if (taueta[i] < 0.0001)
            taueta[i] = 0.0001;
          else if (taueta[i] > (double.MaxValue / (numCities * 100)))
            taueta[i] = double.MaxValue / (numCities * 100);
        }
        sum += taueta[i];
      }

      double[] probs = new double[numCities];
      for (int i = 0; i < probs.Length; ++i)
        probs[i] = taueta[i] / sum; // big trouble if sum = 0.0
      return probs;
    }

    // --------------------------------------------------------------------------------------------

    static void UpdatePheromones(double[][] pheromones, int[][] ants, int[][] dists)
    {
      for (int i = 0; i < pheromones.Length; ++i)
      {
        for (int j = i + 1; j < pheromones[i].Length; ++j)
        {
          for (int k = 0; k < ants.Length; ++k)
          {
            double length = Length(ants[k], dists); // length of ant k trail
            double decrease = (1.0 - rho) * pheromones[i][j];
            double increase = 0.0;
            if (EdgeInTrail(i, j, ants[k]) == true) increase = (Q / length);

            pheromones[i][j] = decrease + increase;

            if (pheromones[i][j] < 0.0001)
              pheromones[i][j] = 0.0001;
            else if (pheromones[i][j] > 100000.0)
              pheromones[i][j] = 100000.0;

            pheromones[j][i] = pheromones[i][j];
          }
        }
      }
    }

    static bool EdgeInTrail(int cityX, int cityY, int[] trail)
    {
      // are cityX and cityY adjacent to each other in trail[]?
      int lastIndex = trail.Length - 1;
      int idx = IndexOfTarget(trail, cityX);

      if (idx == 0 && trail[1] == cityY) return true;
      else if (idx == 0 && trail[lastIndex] == cityY) return true;
      else if (idx == 0) return false;
      else if (idx == lastIndex && trail[lastIndex - 1] == cityY) return true;
      else if (idx == lastIndex && trail[0] == cityY) return true;
      else if (idx == lastIndex) return false;
      else if (trail[idx - 1] == cityY) return true;
      else if (trail[idx + 1] == cityY) return true;
      else return false;
    }


    // --------------------------------------------------------------------------------------------

    static int[][] MakeGraphDistances(int numCities)
    {
      int[][] dists = new int[numCities][];
      for (int i = 0; i < dists.Length; ++i)
        dists[i] = new int[numCities];
      for (int i = 0; i < numCities; ++i)
        for (int j = i + 1; j < numCities; ++j)
        {
          int d = random.Next(1, 9); // [1,8]
          dists[i][j] = d;
          dists[j][i] = d;
        }
      return dists;
    }

    static double Distance(int cityX, int cityY, int[][] dists)
    {
      return dists[cityX][cityY];
    }

    // --------------------------------------------------------------------------------------------

    static void Display(int[] trail)
    {
      for (int i = 0; i < trail.Length; ++i)
      {
        Console.Write(trail[i] + " ");
        if (i > 0 && i % 20 == 0) Console.WriteLine("");
      }
      Console.WriteLine("");
    }


    static void ShowAnts(int[][] ants, int[][] dists)
    {
      for (int i = 0; i < ants.Length; ++i)
      {
        Console.Write(i + ": [ ");

        for (int j = 0; j < 4; ++j)
          Console.Write(ants[i][j] + " ");

        Console.Write(". . . ");

        for (int j = ants[i].Length - 4; j < ants[i].Length; ++j)
          Console.Write(ants[i][j] + " ");

        Console.Write("] len = ");
        double len = Length(ants[i], dists);
        Console.Write(len.ToString("F1"));
        Console.WriteLine("");
      }
    }

    static void Display(double[][] pheromones)
    {
      for (int i = 0; i < pheromones.Length; ++i)
      {
        Console.Write(i + ": ");
        for (int j = 0; j < pheromones[i].Length; ++j)
        {
          Console.Write(pheromones[i][j].ToString("F4").PadLeft(8) + " ");
        }
        Console.WriteLine("");
      }

    }

  } // class AntColonyProgram

} // ns
