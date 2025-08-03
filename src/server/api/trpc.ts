import { loadAllData } from '@/lib/data-loader';
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';

// Load data only once during server startup
let dataLoaded = false;
if (!dataLoaded) {
  loadAllData();
  dataLoaded = true;
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCContext = async (opts: { headers: Headers }) => {
  return {
    headers: opts.headers,
  };
};

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure; 